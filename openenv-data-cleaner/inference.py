import os
import json
try:
    import openai
    has_openai = True
    
    API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
    MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")
    HF_TOKEN = os.getenv("HF_TOKEN")
    
    # Optional – if you use from_docker_image():
    LOCAL_IMAGE_NAME = os.getenv("LOCAL_IMAGE_NAME")

    client = openai.OpenAI(
        base_url=API_BASE_URL,
        api_key=HF_TOKEN if HF_TOKEN else "mock-key"
    )
except ImportError:
    has_openai = False

from backend.env.environment import DataCleaningEnv
from backend.models.schemas import Action
from backend.graders.grader import grade_episode

def run_baseline_inference(task_name: str = "hard"):
    env = DataCleaningEnv(task_name=task_name)
    obs = env.reset()
    done = False
    
    steps = []
    
    system_prompt = """You are an AI data scientist. Your task is to clean a dataset.
You will receive an observation with data statistics.
Action Schema:
{"action_type": "remove_nulls" | "fill_missing_values" | "drop_duplicates" | "normalize_column" | "correct_data_type" | "no_op", "column_name": "str", "fill_value": "any", "target_type": "str"}

Reply strictly with a JSON object of the Action Schema."""

    print("START")

    while not done and env.step_count < 10:
        obs_dict = obs.dict()
        user_prompt = f"Current State: {json.dumps(obs_dict)}\nChoose the next action."
        
        action = None
        if has_openai:
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                action_dict = json.loads(response.choices[0].message.content)
                action = Action(**action_dict)
            except Exception as e:
                pass
                
        if not action:
            # Fallback rule-based mock agent if API fails or no key
            if obs_dict['duplicate_rows_count'] > 0:
                action = Action(action_type="drop_duplicates")
            elif obs_dict['missing_values_count'] > 0:
                action = Action(action_type="remove_nulls")
            else:
                action = Action(action_type="no_op")
                
        obs, reward, done, info = env.step(action)
        steps.append({
            "action": action.dict(),
            "reward": reward,
            "info": info
        })
        
        print(f"STEP")
        
    score = grade_episode(env)
    print("END")
    
    return {
        "task": task_name,
        "score": score,
        "steps_taken": len(steps),
        "history": steps
    }

if __name__ == "__main__":
    result = run_baseline_inference("hard")
    # print(json.dumps(result, indent=2))
