from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import joblib
import os
import pandas as pd

# Initialize FastAPI app
app = FastAPI()

# Load the model and discretizer from the .pkl files
model_path = os.path.join(os.path.dirname('./model.pkl'), 'model.pkl')
discretizer_path = os.path.join(os.path.dirname('./discretizer.pkl'), 'discretizer.pkl')

model = joblib.load(model_path)
discretizer = joblib.load(discretizer_path)

# Define Pydantic model for input data
class InteractionData(BaseModel):
    numSegments: float
    distinctMouseMotions: float
    avgLength: float
    avgTime: float
    avgSpeed: float
    varSpeed: float
    varAcc: float

# Function to classify interaction
def classify_single_interaction(new_data: np.array):
    # Create a DataFrame from the new data and include the correct feature names
    feature_names = ['numSegments', 'distinctMouseMotions', 'avgLength', 'avgTime', 'avgSpeed', 'varSpeed', 'varAcc']
    new_data_df = pd.DataFrame([new_data], columns=feature_names)

    # Discretize the input data using KBinsDiscretizer
    new_data_binned = discretizer.transform(new_data_df)

    # Make a prediction using the trained model
    prediction = model.predict(new_data_binned)
    return "bot" if prediction[0] == -1 else "human"

# Define the API endpoint
@app.post("/classify")
async def classify_interaction(interaction: InteractionData):
    # Convert the input data to numpy array
    new_data = np.array([interaction.numSegments, interaction.distinctMouseMotions,
                         interaction.avgLength, interaction.avgTime,
                         interaction.avgSpeed, interaction.varSpeed,
                         interaction.varAcc])
    
    # Classify the interaction
    result = classify_single_interaction(new_data)
    print(f"Classification result: {result}")  # Log the classification result
    return {"classification": result}