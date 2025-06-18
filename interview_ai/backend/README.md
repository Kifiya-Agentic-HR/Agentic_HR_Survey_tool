# Interview AI Service (Backend)

A multi-agent AI platform to streamline and automate candidate interview preparation, evaluation, and analysis. Powered by **crewAI**, this backend service orchestrates AI agents to collaborate on tasks such as resume parsing, question generation, interview simulation, and candidate scoring.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Service](#running-the-service)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- Multi-agent orchestration via crewAI
- Dynamic configuration of agents and tasks
- Resume parsing and scoring
- Customizable interview question generation
- Automated report generation (`report.md`)
- Environment-aware setup and dependency management

## Architecture

The backend service leverages crewAI to spin up and coordinate several AI agents, each responsible for specific sub-tasks:

1. **Data Loader**: Ingests candidate profiles and resumes.
2. **Parser Agent**: Extracts structured information from resumes.
3. **Question Generator**: Crafts interview questions based on job description and skills.
4. **Simulator Agent**: Runs mock interview scenarios.
5. **Evaluator Agent**: Scores candidate responses and generates insights.
6. **Reporter**: Aggregates outputs and writes `report.md`.

![Architecture Diagram](../assets/InterviewAI-Architecture.png)

## Technology Stack

- Python 3.10 - 3.12
- [crewAI](https://github.com/joaomdmoura/crewai) for agent orchestration
- [UV](https://docs.astral.sh/uv/) for environment and dependency management
- YAML configuration for agents and tasks

## Prerequisites

- Python 3.10+ installed
- [poetry](https://python-poetry.org/) or `pip` and `uv`
- OpenAI API key or another LLM provider credentials

## Installation

1. Clone the repository:
   ```bash
   git clone <repo_url>
   cd services/interview_ai/backend
   ```

2. Install dependencies using UV or Poetry:
   ```bash
   # Using uv
   pip install uv
   crewai install

   # Or using poetry
   poetry install
   ```

## Configuration

Create a `.env` file in the `backend` folder with your environment variables:

```dotenv
OPENAI_API_KEY=your_openai_key
AGENTS_CONFIG=src/interview_ai/config/agents.yaml
TASKS_CONFIG=src/interview_ai/config/tasks.yaml
LOG_LEVEL=INFO
``` 

### Customizing Agents and Tasks

- **Agents**: `src/interview_ai/config/agents.yaml` defines each agent’s role, tools, and parameters.
- **Tasks**: `src/interview_ai/config/tasks.yaml` lists the sequence of tasks for the crew.
- **Business Logic**: Modify `src/interview_ai/crew.py` to introduce custom tools or agent behavior.
- **Entrypoint**: Adjust `src/interview_ai/main.py` for input handling and output directives.

## Running the Service

Execute from the `backend` root:

```bash
crewai run
```

This launches the AI crew, executes the configured tasks, and outputs a `report.md` in the working directory with detailed candidate insights.

## Project Structure

```text
services/interview_ai/backend
├── src/interview_ai
│   ├── config
│   │   ├── agents.yaml
│   │   └── tasks.yaml
│   ├── crew.py         # Setup and tools registration
│   ├── main.py         # Input parsing and run logic
│   └── utils           # Shared utilities
├── tests               # Unit and integration tests
├── pyproject.toml      # Poetry / UV config
├── requirements.txt    # Pip requirements
├── Dockerfile          # Containerization instructions
└── README.md           # This file
```

## Development

- **Code style**: Follow PEP8 and project linting rules.
- **Formatting**: Use `black` and `isort`.
- **IDE support**: Includes VSCode settings in `.vscode/` if needed.

## Testing

Run unit and integration tests:

```bash
pytest --maxfail=1 --disable-warnings -q
``` 

## Deployment

- Build Docker image:
  ```bash
docker build -t interview-ai-backend .
```
- Run container:
  ```bash
docker run --env-file .env interview-ai-backend
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit changes: `git commit -m "Add new feature"`.
4. Push: `git push origin feature/my-feature`.
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](../../LICENSE) file for details.
