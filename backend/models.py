from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    order_index = Column(Integer, unique=True)
    theory = Column(JSON, default=dict)
    track = Column(String, default='core')  # 'core' | 'analyst' | 'engineer'

    levels = relationship("Level", back_populates="module")


class Level(Base):
    __tablename__ = "levels"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=True) # Nullable for Gate
    title = Column(String)
    description = Column(Text)
    starter_code = Column(Text)
    hints = Column(JSON, default=list)
    order_index = Column(Integer, unique=True)
    is_gate = Column(Boolean, default=False)
    difficulty = Column(String, default='easy')  # 'easy' | 'medium' | 'hard'

    module = relationship("Module", back_populates="levels")
    test_cases = relationship("TestCase", back_populates="level", cascade="all, delete")
    user_progress = relationship("UserProgress", back_populates="level", cascade="all, delete")
    submissions = relationship("Submission", back_populates="level", cascade="all, delete")


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    level_id = Column(Integer, ForeignKey("levels.id"))
    stdin = Column(Text, default="")
    expected_output = Column(Text)
    is_hidden = Column(Boolean, default=False)

    level = relationship("Level", back_populates="test_cases")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Using string ID ("guest" for now)
    level_id = Column(Integer, ForeignKey("levels.id"))
    status = Column(String) # 'locked', 'unlocked', 'in_progress', 'completed'
    attempts = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    level = relationship("Level", back_populates="user_progress")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    level_id = Column(Integer, ForeignKey("levels.id"))
    code = Column(Text)
    passed = Column(Boolean)
    created_at = Column(DateTime, default=datetime.utcnow)

    level = relationship("Level", back_populates="submissions")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    career_path = Column(String, nullable=True)  # 'analyst' | 'engineer'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
