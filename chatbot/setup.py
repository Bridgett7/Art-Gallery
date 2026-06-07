"""
Setup script — downloads required NLTK data and pre-caches the transformer model.
Run once: python setup.py
"""
import nltk

print("Downloading NLTK data...")
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('averaged_perceptron_tagger_eng', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('stopwords', quiet=True)
print("NLTK data downloaded.")

print("Pre-loading sentence-transformers model (first time downloads ~22MB)...")
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
# Test encode
result = model.encode(["test"])
print(f"Model loaded. Embedding dimension: {result.shape[1]}")
print("Setup complete!")
