-- Seed skills data for AI/Data Science/CS courses
INSERT INTO public.skills (name, category) VALUES
  -- Programming Languages (CS/AI focused)
  ('Python', 'Programming Languages'),
  ('Java', 'Programming Languages'),
  ('C++', 'Programming Languages'),
  ('C', 'Programming Languages'),
  ('R', 'Programming Languages'),
  ('MATLAB', 'Programming Languages'),
  ('JavaScript', 'Programming Languages'),
  ('TypeScript', 'Programming Languages'),
  ('Scala', 'Programming Languages'),
  ('Julia', 'Programming Languages'),
  
  -- Machine Learning & AI
  ('Machine Learning', 'Machine Learning & AI'),
  ('Deep Learning', 'Machine Learning & AI'),
  ('Neural Networks', 'Machine Learning & AI'),
  ('Natural Language Processing (NLP)', 'Machine Learning & AI'),
  ('Computer Vision', 'Machine Learning & AI'),
  ('Reinforcement Learning', 'Machine Learning & AI'),
  ('Transfer Learning', 'Machine Learning & AI'),
  ('Large Language Models (LLMs)', 'Machine Learning & AI'),
  ('Generative AI', 'Machine Learning & AI'),
  ('Prompt Engineering', 'Machine Learning & AI'),
  
  -- ML/AI Frameworks & Libraries
  ('TensorFlow', 'ML/AI Frameworks'),
  ('PyTorch', 'ML/AI Frameworks'),
  ('Keras', 'ML/AI Frameworks'),
  ('Scikit-learn', 'ML/AI Frameworks'),
  ('Hugging Face', 'ML/AI Frameworks'),
  ('OpenAI API', 'ML/AI Frameworks'),
  ('LangChain', 'ML/AI Frameworks'),
  ('JAX', 'ML/AI Frameworks'),
  ('XGBoost', 'ML/AI Frameworks'),
  ('LightGBM', 'ML/AI Frameworks'),
  
  -- Data Science & Analytics
  ('Data Analysis', 'Data Science'),
  ('Data Visualization', 'Data Science'),
  ('Statistical Analysis', 'Data Science'),
  ('Exploratory Data Analysis (EDA)', 'Data Science'),
  ('Feature Engineering', 'Data Science'),
  ('Data Preprocessing', 'Data Science'),
  ('Time Series Analysis', 'Data Science'),
  ('A/B Testing', 'Data Science'),
  ('Hypothesis Testing', 'Data Science'),
  
  -- Data Science Libraries
  ('Pandas', 'Data Science Tools'),
  ('NumPy', 'Data Science Tools'),
  ('Matplotlib', 'Data Science Tools'),
  ('Seaborn', 'Data Science Tools'),
  ('Plotly', 'Data Science Tools'),
  ('Scipy', 'Data Science Tools'),
  ('Jupyter Notebooks', 'Data Science Tools'),
  ('RStudio', 'Data Science Tools'),
  
  -- Databases & Data Storage
  ('SQL', 'Databases'),
  ('PostgreSQL', 'Databases'),
  ('MySQL', 'Databases'),
  ('MongoDB', 'Databases'),
  ('Redis', 'Databases'),
  ('Apache Spark', 'Databases'),
  ('Hadoop', 'Databases'),
  ('NoSQL', 'Databases'),
  ('Data Warehousing', 'Databases'),
  
  -- Cloud & Infrastructure
  ('AWS', 'Cloud & Infrastructure'),
  ('Google Cloud Platform (GCP)', 'Cloud & Infrastructure'),
  ('Azure', 'Cloud & Infrastructure'),
  ('AWS SageMaker', 'Cloud & Infrastructure'),
  ('Google Colab', 'Cloud & Infrastructure'),
  ('Docker', 'Cloud & Infrastructure'),
  ('Kubernetes', 'Cloud & Infrastructure'),
  ('MLflow', 'Cloud & Infrastructure'),
  ('Weights & Biases (W&B)', 'Cloud & Infrastructure'),
  
  -- Web Development (for AI/ML apps)
  ('React', 'Web Development'),
  ('Next.js', 'Web Development'),
  ('FastAPI', 'Web Development'),
  ('Flask', 'Web Development'),
  ('Django', 'Web Development'),
  ('Streamlit', 'Web Development'),
  ('Gradio', 'Web Development'),
  ('REST APIs', 'Web Development'),
  ('GraphQL', 'Web Development'),
  
  -- Software Engineering & Tools
  ('Git', 'Tools & Practices'),
  ('GitHub', 'Tools & Practices'),
  ('Linux', 'Tools & Practices'),
  ('Agile/Scrum', 'Tools & Practices'),
  ('Software Testing', 'Tools & Practices'),
  ('CI/CD', 'Tools & Practices'),
  ('Object-Oriented Programming', 'Tools & Practices'),
  ('Data Structures & Algorithms', 'Tools & Practices'),
  
  -- Specialized AI/ML Topics
  ('Computer Vision', 'Specialized AI'),
  ('NLP', 'Specialized AI'),
  ('Speech Recognition', 'Specialized AI'),
  ('Recommender Systems', 'Specialized AI'),
  ('Time Series Forecasting', 'Specialized AI'),
  ('Anomaly Detection', 'Specialized AI'),
  ('Clustering', 'Specialized AI'),
  ('Classification', 'Specialized AI'),
  ('Regression', 'Specialized AI'),
  
  -- Research & Academic
  ('Research Methods', 'Research & Academic'),
  ('Academic Writing', 'Research & Academic'),
  ('Paper Reading', 'Research & Academic'),
  ('Experimental Design', 'Research & Academic'),
  ('Model Evaluation', 'Research & Academic'),
  
  -- Domain Knowledge
  ('Healthcare AI', 'Domain Knowledge'),
  ('Finance AI', 'Domain Knowledge'),
  ('Autonomous Systems', 'Domain Knowledge'),
  ('Robotics', 'Domain Knowledge'),
  ('IoT', 'Domain Knowledge')
ON CONFLICT (name) DO NOTHING;
