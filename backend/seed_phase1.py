import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Module, Level, TestCase, UserProgress

# Create tables
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Modules
        modules_data = [
            {
                "id": 1, "name": "Variables", "order_index": 1,
                "theory": {
                    "explanation": "Variables are like labelled boxes where you can store data. You use an equals sign (=) to put a value inside the box. Once you've stored it, you can use the variable name anytime you need that value.",
                    "examples": [
                        { "label": "Easy", "code": "x = 5\nprint(x)", "output": "5" },
                        { "label": "Medium", "code": "name = 'Alice'\nprint('Hello', name)", "output": "Hello Alice" },
                        { "label": "Hard", "code": "a = 10\nb = 20\na = b\nprint(a)", "output": "20" }
                    ]
                }
            },
            {
                "id": 2, "name": "Output", "order_index": 2,
                "theory": {
                    "explanation": "The print() function is how Python talks to the outside world. Whatever you put inside the parentheses will be displayed on the screen. You can print numbers, text (strings), and variables.",
                    "examples": [
                        { "label": "Easy", "code": "print('Hello World')", "output": "Hello World" },
                        { "label": "Medium", "code": "age = 25\nprint('I am', age, 'years old')", "output": "I am 25 years old" },
                        { "label": "Hard", "code": "name = 'Bob'\nprint(f'My name is {name}')", "output": "My name is Bob" }
                    ]
                }
            },
            {
                "id": 3, "name": "Data Types", "order_index": 3,
                "theory": {
                    "explanation": "Data comes in different types. An integer (int) is a whole number. A float is a decimal number. A string (str) is text. You can check a value's type using the type() function, and convert between types using int(), float(), and str().",
                    "examples": [
                        { "label": "Easy", "code": "print(type(5))", "output": "<class 'int'>" },
                        { "label": "Medium", "code": "x = '10'\nnum = int(x)\nprint(num + 5)", "output": "15" },
                        { "label": "Hard", "code": "val = 3.14\ntext = 'Pi is ' + str(val)\nprint(text)", "output": "Pi is 3.14" }
                    ]
                }
            },
            {
                "id": 4, "name": "Input", "order_index": 4,
                "theory": {
                    "explanation": "The input() function asks the user to type something and returns it as a string. If you want to do math with the input, you must convert it into a number using int() or float() first.",
                    "examples": [
                        { "label": "Easy", "code": "# User types 'Alice'\nname = input()\nprint('Hi', name)", "output": "Hi Alice" },
                        { "label": "Medium", "code": "# User types '5'\nnum = int(input())\nprint(num * 2)", "output": "10" },
                        { "label": "Hard", "code": "# User types '3' and '4'\na = float(input())\nb = float(input())\nprint(a + b)", "output": "7.0" }
                    ]
                }
            },
            {
                "id": 5, "name": "Conditionals", "order_index": 5,
                "theory": {
                    "explanation": "Conditionals allow your code to make decisions. The 'if' statement runs code only if a condition is true. You can use 'elif' (else if) for multiple conditions, and 'else' for when everything else is false.",
                    "examples": [
                        { "label": "Easy", "code": "age = 18\nif age >= 18:\n    print('Adult')", "output": "Adult" },
                        { "label": "Medium", "code": "score = 75\nif score >= 90:\n    print('A')\nelif score >= 70:\n    print('B')", "output": "B" },
                        { "label": "Hard", "code": "num = 7\nif num % 2 == 0:\n    print('Even')\nelse:\n    print('Odd')", "output": "Odd" }
                    ]
                }
            },
            {
                "id": 6, "name": "Loops", "order_index": 6,
                "theory": {
                    "explanation": "Loops let you repeat actions without writing the same code over and over. A 'for' loop combined with range() is perfect for doing something a specific number of times.",
                    "examples": [
                        { "label": "Easy", "code": "for i in range(3):\n    print('Hello')", "output": "Hello\\nHello\\nHello" },
                        { "label": "Medium", "code": "for i in range(1, 4):\n    print(i)", "output": "1\\n2\\n3" },
                        { "label": "Hard", "code": "total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)", "output": "6" }
                    ]
                }
            },
        ]
        
        for m_data in modules_data:
            mod = db.query(Module).filter(Module.id == m_data["id"]).first()
            if not mod:
                mod = Module(**m_data)
                db.add(mod)
            else:
                for k, v in m_data.items():
                    setattr(mod, k, v)
        db.commit()

        # Levels
        levels_data = [
            # Module 1
            {
                "id": 1, "module_id": 1, "order_index": 1, "title": "Your First Variable",
                "description": "Create a variable named `x`, assign the value `5` to it, and print it.",
                "starter_code": "# Create x here\n\n# Print x here\n",
                "hints": ["Use x = 5 to assign.", "Use print(x) to output."],
                "is_gate": False
            },
            {
                "id": 2, "module_id": 1, "order_index": 2, "title": "Swap Values",
                "description": "Variables `a` and `b` are given. Swap their values and print `a` then `b` on separate lines.",
                "starter_code": "a = 10\nb = 20\n# Swap them below\n\n\nprint(a)\nprint(b)\n",
                "hints": ["You can use a temporary variable, e.g., temp = a", "Python allows a, b = b, a"],
                "is_gate": False
            },
            # Module 2
            {
                "id": 3, "module_id": 2, "order_index": 3, "title": "Print Multiple Lines",
                "description": "Print 'Hello' on the first line and 'World' on the second line.",
                "starter_code": "# Print Hello\n\n# Print World\n",
                "hints": ["Use two print statements."],
                "is_gate": False
            },
            {
                "id": 4, "module_id": 2, "order_index": 4, "title": "String Formatting",
                "description": "Given `name` and `age`, print 'My name is [name] and I am [age] years old' using an f-string.",
                "starter_code": "name = 'Alice'\nage = 30\n# Use an f-string to print the sentence\n",
                "hints": ["f-strings look like this: f\"Hello {name}\""],
                "is_gate": False
            },
            # Module 3
            {
                "id": 5, "module_id": 3, "order_index": 5, "title": "Identify Types",
                "description": "Print the type of the variable `val`.",
                "starter_code": "val = 3.14\n# Print the type of val\n",
                "hints": ["Use the type() function."],
                "is_gate": False
            },
            {
                "id": 6, "module_id": 3, "order_index": 6, "title": "Convert Types",
                "description": "Convert the string `s` to an integer, then convert it to a float. Print the final float.",
                "starter_code": "s = '42'\n# Convert to int, then to float, then print\n",
                "hints": ["Use int(s) to convert to integer.", "Use float(x) to convert to float."],
                "is_gate": False
            },
            # Module 4
            {
                "id": 7, "module_id": 4, "order_index": 7, "title": "Greet User",
                "description": "Read a name from standard input using `input()` and print 'Hello [name]!'",
                "starter_code": "# Read name\n\n# Print greeting\n",
                "hints": ["name = input()", "print(f'Hello {name}!')"],
                "is_gate": False
            },
            {
                "id": 8, "module_id": 4, "order_index": 8, "title": "Add Two Numbers",
                "description": "Read two numbers from input (on separate lines), add them, and print the sum.",
                "starter_code": "# Read a and b\n\n# Add them and print\n",
                "hints": ["Remember to convert the input to float or int!"],
                "is_gate": False
            },
            # Module 5
            {
                "id": 9, "module_id": 5, "order_index": 9, "title": "Even or Odd",
                "description": "Read an integer. If it's even, print 'Even'. Otherwise print 'Odd'.",
                "starter_code": "# Read number\n\n# Check if even or odd\n",
                "hints": ["Use the modulo operator: num % 2 == 0"],
                "is_gate": False
            },
            {
                "id": 10, "module_id": 5, "order_index": 10, "title": "Grade Classifier",
                "description": "Read a score (integer). Print 'A' for >=90, 'B' for >=80, 'C' for >=70, else 'F'.",
                "starter_code": "# Read score\n\n# Print grade\n",
                "hints": ["Use if, elif, and else statements."],
                "is_gate": False
            },
            # Module 6
            {
                "id": 11, "module_id": 6, "order_index": 11, "title": "Print 1 to N",
                "description": "Read an integer N. Print all numbers from 1 to N (inclusive) on separate lines.",
                "starter_code": "# Read N\n\n# Loop and print\n",
                "hints": ["Use a for loop: for i in range(1, N + 1):"],
                "is_gate": False
            },
            {
                "id": 12, "module_id": 6, "order_index": 12, "title": "Sum 1 to N",
                "description": "Read an integer N. Calculate and print the sum of all numbers from 1 to N.",
                "starter_code": "# Read N\n\n# Calculate sum and print\n",
                "hints": ["Initialize a sum variable to 0 before the loop."],
                "is_gate": False
            },
            # Gate (Level 13)
            {
                "id": 13, "module_id": None, "order_index": 13, "title": "Final Challenge — Calculator",
                "description": "Build a calculator. Read three lines: num1, num2, and an operator (+, -, *, /). Print the result. Do not show the expected output, hidden tests are used.",
                "starter_code": "# Read inputs\n\n# Calculate and print result\n",
                "hints": [],
                "is_gate": True
            }
        ]

        for l_data in levels_data:
            lvl = db.query(Level).filter(Level.id == l_data["id"]).first()
            if not lvl:
                lvl = Level(**l_data)
                db.add(lvl)
            else:
                for k, v in l_data.items():
                    setattr(lvl, k, v)
        db.commit()

        # Test Cases
        tests_data = [
            {"level_id": 1, "stdin": "", "expected_output": "5\n", "is_hidden": False},
            {"level_id": 2, "stdin": "", "expected_output": "20\n10\n", "is_hidden": False},
            {"level_id": 3, "stdin": "", "expected_output": "Hello\nWorld\n", "is_hidden": False},
            {"level_id": 4, "stdin": "", "expected_output": "My name is Alice and I am 30 years old\n", "is_hidden": False},
            {"level_id": 5, "stdin": "", "expected_output": "<class 'float'>\n", "is_hidden": False},
            {"level_id": 6, "stdin": "", "expected_output": "42.0\n", "is_hidden": False},
            {"level_id": 7, "stdin": "Bob\n", "expected_output": "Hello Bob!\n", "is_hidden": False},
            {"level_id": 8, "stdin": "5\n7\n", "expected_output": "12\n", "is_hidden": False},
            {"level_id": 9, "stdin": "4\n", "expected_output": "Even\n", "is_hidden": False},
            {"level_id": 9, "stdin": "7\n", "expected_output": "Odd\n", "is_hidden": False},
            {"level_id": 10, "stdin": "85\n", "expected_output": "B\n", "is_hidden": False},
            {"level_id": 10, "stdin": "60\n", "expected_output": "F\n", "is_hidden": False},
            {"level_id": 11, "stdin": "3\n", "expected_output": "1\n2\n3\n", "is_hidden": False},
            {"level_id": 12, "stdin": "4\n", "expected_output": "10\n", "is_hidden": False},
            # Gate hidden tests
            {"level_id": 13, "stdin": "2\n3\n+\n", "expected_output": "5\n", "is_hidden": True},
            {"level_id": 13, "stdin": "10\n5\n-\n", "expected_output": "5\n", "is_hidden": True},
            {"level_id": 13, "stdin": "4\n2\n*\n", "expected_output": "8\n", "is_hidden": True},
            {"level_id": 13, "stdin": "8\n2\n/\n", "expected_output": "4.0\n", "is_hidden": True},
        ]
        
        # Clear existing test cases and re-add them to avoid duplicates if seed is run multiple times
        db.query(TestCase).delete()
        for t_data in tests_data:
            tc = TestCase(**t_data)
            db.add(tc)
        db.commit()

        # Seed User Progress for "guest"
        user_id = "guest"
        for i in range(1, 14):
            up = db.query(UserProgress).filter(UserProgress.user_id == user_id, UserProgress.level_id == i).first()
            if not up:
                status = 'unlocked' if i == 1 else 'locked'
                up = UserProgress(user_id=user_id, level_id=i, status=status)
                db.add(up)
        db.commit()

        print("Database seeded successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
