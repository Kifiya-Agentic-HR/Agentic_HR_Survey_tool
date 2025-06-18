from crewai import Agent, Crew, Task, Process
import yaml
from crewai.project import CrewBase, agent, crew, task
import os
###############################################################################
# Crew 3: Final Evaluator Crew
#   - Contains the Final Evaluator agent and task.
#   - Input: entire conversation_history and skills dict.
#   - Provides the final evaluation output.
###############################################################################
@CrewBase
class EvaluatorCrew:
    """Final Evaluator Crew: Provides the final evaluation at interview end."""

    base_dir = os.path.dirname(__file__)
    agents_config = os.path.join(base_dir, 'config', 'eval_agents.yaml')
    tasks_config = os.path.join(base_dir, 'config', 'eval_tasks.yaml')

    def __init__(self):
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Load configs
        with open(self.agents_config, 'r') as f:
            self.agents_config = yaml.safe_load(f)
        
        with open(self.tasks_config, 'r') as f:
            self.tasks_config = yaml.safe_load(f)

        for agent_name in ['final_evaluator', 'json_formatter']:
            self.agents_config[agent_name]['llm'] = 'gemini-pro'
            self.tasks_config['final_evaluation_task']['llm'] = 'gemini-pro'

    @agent
    def final_evaluator(self) -> Agent:
        return Agent(
            config=self.agents_config['final_evaluator'],
            verbose=True
        )

    @agent
    def json_formatter(self) -> Agent:
        return Agent(
            config=self.agents_config['json_formatter'],
            verbose=True
        )
    
    @task
    def final_evaluation_task(self) -> Task:
        return Task(
            config=self.tasks_config['final_evaluation_task'],
            agent=self.final_evaluator(),
            verbose=True
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=[self.final_evaluator(), self.json_formatter()],
            tasks=[self.final_evaluation_task()],
            process=Process.sequential,  # Explicit process definition
            verbose=True,
            output_log_file='logs/eval_crew.log'
        )