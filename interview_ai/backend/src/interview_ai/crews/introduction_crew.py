from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
import os
import yaml


###############################################################################
# Crew 2: Welcome Crew
#   - Contains one agent and task.
#   - Input: role info and user info.
#   - Provides a welcome message and explains the interview process.
###############################################################################
@CrewBase
class IntroductionCrew:
    """Welcome Crew: Greets the user and explains the interview process."""

    base_dir = os.path.dirname(__file__)
    agents_config = os.path.join(base_dir, 'config', 'intro_agents.yaml')
    tasks_config = os.path.join(base_dir, 'config', 'intro_tasks.yaml')

    def __init__(self):
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Load configs
        with open(self.agents_config, 'r') as f:
            self.agents_config = yaml.safe_load(f)
        
        with open(self.tasks_config, 'r') as f:
            self.tasks_config = yaml.safe_load(f)

        # Ensure Gemini is used
        self.agents_config['welcome_agent']['llm'] = 'gemini/gemini-pro'
        self.tasks_config['welcome_task']['llm'] = 'gemini/gemini-pro'

    @agent
    def welcome_agent(self) -> Agent:
        """Welcome Agent config."""
        return Agent(
            config=self.agents_config['welcome_agent'],
            verbose=True
        )

    @task
    def welcome_task(self) -> Task:
        """Task for generating a welcome message."""
        return Task(
            config=self.tasks_config['welcome_task'],
            agent=self.welcome_agent(),
            verbose=True
        )

    @crew
    def crew(self) -> Crew:
        """Defines the Welcome Crew."""
        return Crew(
            agents=[self.welcome_agent()],
            tasks=[self.welcome_task()],
            verbose=True,
            output_log_file='logs/welcome_crew.log'
        )