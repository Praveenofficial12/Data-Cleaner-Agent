import pandas as pd
import numpy as np

def create_easy_task():
    """Dataset with only missing values"""
    data = {
        'id': [1, 2, 3, 4, 5],
        'age': [25, np.nan, 30, 22, np.nan],
        'income': [50000, 60000, np.nan, 45000, 70000]
    }
    df = pd.DataFrame(data)
    
    expected_data = {
        'id': [1, 2, 3, 4, 5],
        'age': [25, 25, 30, 22, 25], # Assume filled with 25 or something, or dropped
        'income': [50000, 60000, 50000, 45000, 70000]
    }
    # It's better if the goal is to remove nulls or fill with specific strategy
    return df

def create_medium_task():
    """Dataset with missing values + duplicates"""
    data = {
        'id': [1, 2, 2, 4, 5, 5],
        'score': [88.5, np.nan, np.nan, 92.0, 85.0, 85.0],
        'category': ['A', 'B', 'B', 'A', 'C', 'C']
    }
    df = pd.DataFrame(data)
    return df

def create_hard_task():
    """Dataset with multiple issues (nulls, duplicates, wrong types, inconsistencies)"""
    data = {
        'id': ['1', '2', '2', 'four', '5'],
        'price': ['$100', '$200', '$200', np.nan, '$150'],
        'status': ['active', 'inactive', 'inactive', 'ACTIVE', 'unknown']
    }
    df = pd.DataFrame(data)
    return df

TASKS = {
    'easy': create_easy_task,
    'medium': create_medium_task,
    'hard': create_hard_task
}

def get_task_data(task_name: str) -> pd.DataFrame:
    if task_name not in TASKS:
        raise ValueError(f"Unknown task: {task_name}")
    return TASKS[task_name]().copy()
