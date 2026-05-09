from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import asc
from typing import Optional
import subprocess
import sys
import tempfile
import os

import models
import schemas
from database import engine, get_db

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DataCode Learning Engine API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only. Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_output(x: str) -> str:
    """Normalize output for comparison: convert to float if possible, else lowercase strip."""
    try:
        return str(round(float(x.strip()), 5))
    except (ValueError, TypeError):
        return x.strip().lower()


def run_python_code(code: str, stdin: str = "") -> dict:
    """
    Execute Python code safely in a subprocess with a timeout.
    Returns {"stdout": ..., "stderr": ..., "returncode": ...}
    """
    # Write code to a temp file
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as f:
        f.write(code)
        tmp_path = f.name

    try:
        result = subprocess.run(
            [sys.executable, tmp_path],
            input=stdin,
            capture_output=True,
            text=True,
            timeout=10,  # 10-second hard limit
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "Execution timed out (10s limit).", "returncode": 1}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "returncode": 1}
    finally:
        os.unlink(tmp_path)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "DataCode API is running"}


@app.get("/modules", response_model=list[schemas.ModuleResponse])
def get_modules(track: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.Module).order_by(asc(models.Module.order_index))
    if track:
        q = q.filter(models.Module.track == track)
    return q.all()


@app.get("/modules/{module_id}/theory")
def get_module_theory(module_id: int, db: Session = Depends(get_db)):
    module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module.theory


@app.post("/user/{user_id}/career-path")
def set_career_path(user_id: str, req: schemas.CareerPathRequest, db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if profile:
        profile.career_path = req.path
    else:
        profile = models.UserProfile(user_id=user_id, career_path=req.path)
        db.add(profile)
    db.commit()

    # Auto-unlock the first level of each module in the chosen track
    track_modules = (
        db.query(models.Module)
        .filter(models.Module.track == req.path)
        .order_by(asc(models.Module.order_index))
        .all()
    )
    for module in track_modules:
        first_level = (
            db.query(models.Level)
            .filter(models.Level.module_id == module.id, models.Level.is_gate == False)
            .order_by(asc(models.Level.order_index))
            .first()
        )
        if first_level:
            prog = (
                db.query(models.UserProgress)
                .filter(
                    models.UserProgress.user_id == user_id,
                    models.UserProgress.level_id == first_level.id,
                )
                .first()
            )
            if prog and prog.status == "locked":
                prog.status = "unlocked"
    db.commit()

    return {"user_id": user_id, "career_path": req.path}


@app.get("/user/{user_id}/career-path", response_model=schemas.CareerPathResponse)
def get_career_path(user_id: str, db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    return {"user_id": user_id, "career_path": profile.career_path if profile else None}


@app.get("/levels", response_model=list[schemas.LevelResponse])
def get_levels(db: Session = Depends(get_db)):
    return db.query(models.Level).order_by(asc(models.Level.order_index)).all()


@app.get("/user/{user_id}/progress", response_model=list[schemas.UserProgressResponse])
def get_user_progress(user_id: str, db: Session = Depends(get_db)):
    return (
        db.query(models.UserProgress)
        .filter(models.UserProgress.user_id == user_id)
        .all()
    )


@app.post("/levels/start")
def start_level(req: schemas.StartLevelRequest, db: Session = Depends(get_db)):
    """Mark a level as in_progress if it is unlocked."""
    progress = (
        db.query(models.UserProgress)
        .filter(
            models.UserProgress.user_id == req.user_id,
            models.UserProgress.level_id == req.level_id,
        )
        .first()
    )

    if not progress:
        raise HTTPException(status_code=404, detail="User progress not found")

    if progress.status == "unlocked":
        progress.status = "in_progress"
        db.commit()

    return {"status": "success", "level_status": progress.status}


@app.post("/submissions", response_model=schemas.SubmissionResponse)
def create_submission(
    submission: schemas.SubmissionRequest, db: Session = Depends(get_db)
):
    level = (
        db.query(models.Level).filter(models.Level.id == submission.level_id).first()
    )
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    user_progress = (
        db.query(models.UserProgress)
        .filter(
            models.UserProgress.user_id == submission.user_id,
            models.UserProgress.level_id == submission.level_id,
        )
        .first()
    )

    if not user_progress:
        raise HTTPException(status_code=400, detail="User has no access to this level")

    if user_progress.status == "locked":
        raise HTTPException(status_code=403, detail="Level is locked")

    # Increment attempt count and mark in_progress
    user_progress.attempts += 1
    if user_progress.status == "unlocked":
        user_progress.status = "in_progress"
    db.commit()

    test_cases = (
        db.query(models.TestCase)
        .filter(models.TestCase.level_id == submission.level_id)
        .all()
    )

    all_passed = True
    fail_message = None

    # --- Run code against each test case locally ---
    for tc in test_cases:
        result = run_python_code(submission.code, tc.stdin)

        if result["returncode"] != 0:
            all_passed = False
            fail_message = f"Runtime error:\n{result['stderr'].strip()}"
            break

        actual_output = result["stdout"]

        # Compare line by line (handles multi-line outputs robustly)
        actual_lines = [normalize_output(l) for l in actual_output.strip().splitlines()]
        expected_lines = [normalize_output(l) for l in tc.expected_output.strip().splitlines()]

        if actual_lines != expected_lines:
            all_passed = False
            if tc.is_hidden:
                fail_message = "Failed on a hidden test case. Keep trying!"
            else:
                fail_message = (
                    f"Test failed.\n"
                    f"Expected:\n{tc.expected_output.strip()}\n\n"
                    f"Got:\n{actual_output.strip()}"
                )
            break

    # Record submission
    db_submission = models.Submission(
        user_id=submission.user_id,
        level_id=submission.level_id,
        code=submission.code,
        passed=all_passed,
    )
    db.add(db_submission)

    next_level_id = None
    if all_passed:
        user_progress.status = "completed"

        # Find next level by order_index
        next_level = (
            db.query(models.Level)
            .filter(models.Level.order_index == level.order_index + 1)
            .first()
        )
        if next_level:
            next_level_id = next_level.id
            # Unlock next level for this user
            next_progress = (
                db.query(models.UserProgress)
                .filter(
                    models.UserProgress.user_id == submission.user_id,
                    models.UserProgress.level_id == next_level.id,
                )
                .first()
            )
            if next_progress and next_progress.status == "locked":
                next_progress.status = "unlocked"

    db.commit()

    return schemas.SubmissionResponse(
        passed=all_passed,
        message="All test cases passed! 🎉" if all_passed else fail_message,
        next_level_id=next_level_id,
    )
