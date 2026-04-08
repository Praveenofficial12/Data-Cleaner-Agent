import pandas as pd
from env.environment import DataCleaningEnv

def grade_episode(env: DataCleaningEnv) -> float:
    """
    Returns a score between 0.0 and 1.0 based on data cleanliness and efficiency.
    """
    df = env.df
    score = 1.0
    
    # Penalize for remaining missing values
    missing = int(df.isna().sum().sum())
    if missing > 0:
        score -= min(0.4, missing * 0.1)
        
    # Penalize for remaining duplicates
    duplicates = int(df.duplicated().sum())
    if duplicates > 0:
        score -= min(0.3, duplicates * 0.1)
        
    # Check for correct data types (simple heuristic: no "object" type that should be numeric)
    # E.g. string numbers
    for col in df.columns:
        if df[col].dtype == 'object':
            # Try to see if it's mostly numeric
            numeric_count = pd.to_numeric(df[col], errors='coerce').notna().sum()
            if numeric_count > len(df) * 0.5:
                # It's highly likely this should have been converted
                score -= 0.1
                
    # Penalize for too many steps (inefficient)
    if env.step_count > 10:
        score -= min(0.2, (env.step_count - 10) * 0.02)
        
    return max(0.0, score)
