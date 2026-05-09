from database import SessionLocal
from models import Module, Level, TestCase, UserProgress

E, M, H = 'easy', 'medium', 'hard'

MODULES = [
  {"id":12,"name":"Lists & Comprehensions","order_index":12,"track":"analyst","theory":{}},
  {"id":13,"name":"Dictionaries","order_index":13,"track":"analyst","theory":{}},
  {"id":14,"name":"Functions","order_index":14,"track":"analyst","theory":{}},
  {"id":15,"name":"Reading Files/CSV","order_index":15,"track":"analyst","theory":{}},
  {"id":16,"name":"NumPy Basics","order_index":16,"track":"analyst","theory":{}},
  {"id":17,"name":"Pandas Intro","order_index":17,"track":"analyst","theory":{}},
  {"id":18,"name":"Data Visualization","order_index":18,"track":"analyst","theory":{}},
  {"id":19,"name":"Statistics Basics","order_index":19,"track":"analyst","theory":{}},
  {"id":20,"name":"Final Project - EDA","order_index":20,"track":"analyst","theory":{}},
]

LEVELS = []
TESTS = []
start_level_id = 100

def add_levels(mod_id, num_levels, diffs):
    global start_level_id
    for i in range(num_levels):
        lid = start_level_id
        start_level_id += 1
        is_gate = (mod_id == 20)
        LEVELS.append({
            "id": lid, "module_id": mod_id if not is_gate else None, "order_index": lid,
            "title": f"Analyst Ex {lid}", "difficulty": diffs[i], "is_gate": is_gate,
            "description": f"Solve analyst exercise {lid}. Just print 'ok' to pass.",
            "starter_code": "print('ok')\n",
            "hints": ["Just print 'ok'"]
        })
        TESTS.append({"level_id": lid, "stdin": "", "expected_output": "ok\n", "is_hidden": False})
        TESTS.append({"level_id": lid, "stdin": "hidden\n", "expected_output": "ok\n", "is_hidden": True})

add_levels(12, 5, [E,E,M,M,H])
add_levels(13, 5, [E,E,M,M,H])
add_levels(14, 5, [E,M,M,H,H])
add_levels(15, 4, [E,M,M,H])
add_levels(16, 4, [E,M,H,H])
add_levels(17, 5, [E,E,M,H,H])
add_levels(18, 4, [E,M,M,H])
add_levels(19, 4, [E,M,H,H])
add_levels(20, 1, [H])

def seed():
    db = SessionLocal()
    try:
        for m in MODULES:
            if not db.query(Module).filter_by(id=m['id']).first():
                db.add(Module(**m))
        db.commit()
        for lv in LEVELS:
            if not db.query(Level).filter_by(id=lv['id']).first():
                db.add(Level(**lv))
        db.commit()
        for t in TESTS:
            if not db.query(TestCase).filter_by(level_id=t['level_id'], is_hidden=t['is_hidden']).first():
                db.add(TestCase(**t))
        db.commit()
        
        all_levels = db.query(Level).filter(Level.id >= 100, Level.id < 200).order_by(Level.order_index).all()
        for lv in all_levels:
            if not db.query(UserProgress).filter_by(user_id="guest", level_id=lv.id).first():
                db.add(UserProgress(user_id="guest", level_id=lv.id, status="locked"))
        db.commit()
        print(f"Seeded Analyst: {len(LEVELS)} levels, {len(TESTS)} test cases")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
