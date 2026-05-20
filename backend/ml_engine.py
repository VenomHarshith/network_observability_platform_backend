import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )
        self.trained = False

    def train(self, X):
        self.model.fit(X)
        self.trained = True

    def score(self, X):
        if not self.trained:
            return 0.0

        score = -self.model.decision_function(X)[0]
        return round(float(score), 3)
