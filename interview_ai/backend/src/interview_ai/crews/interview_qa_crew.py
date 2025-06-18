from crewai import Agent, Crew, Task
from crewai.project import CrewBase, agent, crew, task
import yaml
import os

@CrewBase
class ExitInterviewQACrew:
    """Exit Interview QA Crew: Handles asking exit questions and formatting the response."""

    def __init__(self):
        # Load environment variables first
        from dotenv import load_dotenv
        load_dotenv()
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        config_dir = os.path.abspath(os.path.join(base_dir, "..", "crews", "config"))

        # Load configs
        with open(os.path.join(config_dir, "agents.yaml"), "r") as f:
            self.agents_config = yaml.safe_load(f)
        
        with open(os.path.join(config_dir, "tasks.yaml"), "r") as f:
            self.tasks_config = yaml.safe_load(f)

        # Force Gemini if not specified in YAML
        for agent in self.agents_config.values():
            agent.setdefault("llm", {}).update({
                "model": "gemini/gemini-pro",
                "provider": "google"
            })

    @agent
    def response_handler(self) -> Agent:
        return Agent(config=self.agents_config["response_handler"])

    @agent
    def question_generator(self) -> Agent:
        return Agent(config=self.agents_config["question_generator"])

    @agent
    def output_formatter(self) -> Agent:
        return Agent(config=self.agents_config["output_formatter"])

    @task
    def capture_response_task(self) -> Task:
        return Task(config=self.tasks_config["capture_response_task"])

    @task
    def question_generation_task(self) -> Task:
        return Task(
            config=self.tasks_config["question_generation_task"],
            context=[self.capture_response_task()]
        )

    @task
    def format_output_task(self) -> Task:
        return Task(
            config=self.tasks_config["format_output_task"],
            context=[self.question_generation_task()]
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=[
                self.question_generator(),
                self.response_handler(),
                self.output_formatter()
            ],
            tasks=[
                self.capture_response_task(),
                self.question_generation_task(),
                self.format_output_task()
            ],
            output_log_file='logs/exit_qa_crew.log'
        )
