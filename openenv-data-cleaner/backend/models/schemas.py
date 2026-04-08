from pydantic import BaseModel
from typing import Dict, Any, Optional

class Observation(BaseModel):
    num_rows: int
    num_cols: int
    missing_values_count: int
    duplicate_rows_count: int
    data_consistency_score: float
    column_data_types: Dict[str, str]
    summary_statistics: Dict[str, Dict[str, float]]

class Action(BaseModel):
    action_type: str # remove_nulls, fill_missing_values, drop_duplicates, normalize_column, correct_data_type, no_op
    column_name: Optional[str] = None
    fill_value: Optional[Any] = None
    target_type: Optional[str] = None

class Reward(BaseModel):
    reward: float
    reason: str
