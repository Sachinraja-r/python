from pydantic import BaseModel
from typing import List, Optional

class SubmissionRequest(BaseModel):
    user_id: str
    level_id: int
    code: str

class SubmissionResponse(BaseModel):
    passed: bool
    message: Optional[str] = None
    next_level_id: Optional[int] = None

class CareerPathRequest(BaseModel):
    path: str  # 'analyst' | 'engineer'

class CareerPathResponse(BaseModel):
    user_id: str
    career_path: Optional[str] = None

class TestCaseResponse(BaseModel):
    id: int
    stdin: str
    expected_output: str
    is_hidden: bool

    class Config:
        from_attributes = True

class LevelResponse(BaseModel):
    id: int
    module_id: Optional[int]
    title: str
    description: str
    starter_code: str
    hints: List[str]
    order_index: int
    is_gate: bool
    difficulty: str = 'easy'

    class Config:
        from_attributes = True

class ModuleResponse(BaseModel):
    id: int
    name: str
    order_index: int
    theory: dict = {}
    track: str = 'core'

    class Config:
        from_attributes = True

class UserProgressResponse(BaseModel):
    level_id: int
    status: str
    attempts: int

    class Config:
        from_attributes = True

class StartLevelRequest(BaseModel):
    user_id: str
    level_id: int
