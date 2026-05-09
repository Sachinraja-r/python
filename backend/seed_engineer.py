from database import SessionLocal
from models import Module, Level, TestCase, UserProgress

E, M, H = 'easy', 'medium', 'hard'

MODULES = [
  {"id":21,"name":"Lists & Comprehensions","order_index":21,"track":"engineer","theory":{}},
  {"id":22,"name":"Dictionaries","order_index":22,"track":"engineer","theory":{}},
  {"id":23,"name":"Functions","order_index":23,"track":"engineer","theory":{}},
  {"id":24,"name":"File I/O","order_index":24,"track":"engineer","theory":{}},
  {"id":25,"name":"String Manipulation","order_index":25,"track":"engineer","theory":{}},
  {"id":26,"name":"JSON with Python","order_index":26,"track":"engineer","theory":{}},
  {"id":27,"name":"SQLite with Python","order_index":27,"track":"engineer","theory":{}},
  {"id":28,"name":"Data Pipeline Basics","order_index":28,"track":"engineer","theory":{}},
  {"id":29,"name":"Final Project - ETL","order_index":29,"track":"engineer","theory":{}},
]

LEVELS = []
TESTS = []
start_level_id = 200

def add_levels(mod_id, num_levels, diffs):
    global start_level_id
    for i in range(num_levels):
        lid = start_level_id
        start_level_id += 1
        is_gate = (mod_id == 29)
        LEVELS.append({
            "id": lid, "module_id": mod_id if not is_gate else None, "order_index": lid,
            "title": f"Engineer Ex {lid}", "difficulty": diffs[i], "is_gate": is_gate,
            "description": f"Solve engineer exercise {lid}. Just print 'ok' to pass.",
            "starter_code": "print('ok')\n",
            "hints": ["Just print 'ok'"]
        })
        TESTS.append({"level_id": lid, "stdin": "", "expected_output": "ok\n", "is_hidden": False})
        TESTS.append({"level_id": lid, "stdin": "hidden\n", "expected_output": "ok\n", "is_hidden": True})

add_levels(21, 5, [E,E,M,M,H])
add_levels(22, 5, [E,E,M,M,H])
add_levels(23, 5, [E,M,M,H,H])
add_levels(24, 4, [E,M,M,H])
add_levels(25, 4, [E,M,M,H])
add_levels(26, 4, [E,M,M,H])
add_levels(27, 5, [E,E,M,M,H])
add_levels(28, 4, [E,M,M,H])
add_levels(29, 1, [H])

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
        
        all_levels = db.query(Level).filter(Level.id >= 200, Level.id < 300).order_by(Level.order_index).all()
        for lv in all_levels:
            if not db.query(UserProgress).filter_by(user_id="guest", level_id=lv.id).first():
                db.add(UserProgress(user_id="guest", level_id=lv.id, status="locked"))
        db.commit()
        print(f"Seeded Engineer: {len(LEVELS)} levels, {len(TESTS)} test cases")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
