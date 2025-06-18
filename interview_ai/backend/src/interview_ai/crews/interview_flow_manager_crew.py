from crewai import Agent, Crew, Task
from crewai.project import CrewBase, agent, crew, task
import yaml
import os

###############################################################################
# Crew 4: State Determiner Crew
#   - Contains an agent that determines the interview's current state.
#   - Input: conversation_history and skills dict.
#   - Output: one of "welcome", "interview", or "completion".
###############################################################################
@CrewBase
class InterviewFlowManagerCrew:
    """State Determiner Crew: Determines the current state of the interview flow."""

    base_dir = os.path.dirname(__file__)
    agents_config = os.path.join(base_dir, 'config', 'flow_agents.yaml')
    tasks_config = os.path.join(base_dir, 'config', 'flow_tasks.yaml')

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
        self.agents_config['flow_manager']['llm'] = 'gemini-pro'
        self.tasks_config['flow_management_task']['llm'] = 'gemini-pro'

    @agent
    def flow_manager(self) -> Agent:
        """Flow Manager agent config to decide the interview stage."""
        return Agent(
            config=self.agents_config['flow_manager'],
            verbose=True
        )

    @task
    def flow_manager_task(self) -> Task:
        """Task for determining the current state of the interview."""
        return Task(
            config=self.tasks_config['flow_management_task'],
            agent=self.flow_manager(),
            verbose=True
        )

    @crew
    def crew(self) -> Crew:
        """Defines the State Determiner Crew."""
        return Crew(
            agents=[self.flow_manager()],
            tasks=[self.flow_manager_task()],
            verbose=True,
            output_log_file='logs/flow_manager_crew.log'
        )