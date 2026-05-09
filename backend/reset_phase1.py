from sqlalchemy.orm import Session
from database import SessionLocal
from models import UserProgress, Submission

def reset():
    db = SessionLocal()
    try:
        # Delete submissions
        db.query(Submission).delete()
        
        # Reset progress
        progress = db.query(UserProgress).all()
        for p in progress:
            p.status = 'unlocked' if p.level_id == 1 else 'locked'
            p.attempts = 0
            
        db.commit()
        print("Progress and submissions reset successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    reset()
