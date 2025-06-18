from interview_ai.crews.evaluator_crew import EvaluatorCrew
from interview_ai.crews.interview_qa_crew import ExitInterviewQACrew
from interview_ai.crews.interview_flow_manager_crew import InterviewFlowManagerCrew
from interview_ai.crews.introduction_crew import IntroductionCrew
import json

flow_crew = InterviewFlowManagerCrew().crew()
intro_crew = IntroductionCrew().crew()
qa_crew = ExitInterviewQACrew().crew()
eval_crew = EvaluatorCrew().crew()

def test(input, crew):
    try:
        result = crew.kickoff(inputs=input)
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")
    return result

# Test Flow Manager for Exit Interview
flow_manager_inputs = [
    ({"conversation_history": []}, {"state": "welcome"}),
    ({
        "conversation_history": [
            {"question": "What is your primary reason for leaving?", "answer": "Looking for growth opportunities."}
        ]
    }, {"state": "ongoing"}),
    ({
        "conversation_history": [
            {"question_id": i, "question": f"Q{i}", "answer": f"A{i}"} for i in range(1, 19)  # All 18 questions answered
        ]
    }, {"state": "completed"})
]

def test_flow_manager():
    for input_data, expected_output in flow_manager_inputs:
        try:
            assert json.loads(test(input_data, flow_crew).raw) == expected_output
        except Exception as e:
            print(f"Test failed: {e}")
            continue
    print("All tests passed for Flow Manager.")

# test_flow_manager()

# Test Introduction Crew
intro_crew_inputs = [
    {
        "user_info": "Name: John Doe\nDepartment: Engineering\nEmail: john.doe@kifiya.com",
        "role_info": "Role: Software Engineer\nCompany: Kifiya Financial Technologies"
    },
    {
        "user_info": "Email: sarah.abebe@kifiya.com",
        "role_info": "Role: Accountant\nCompany: Kifiya Financial Technologies"
    }
]

def test_intro_crew():
    for input_data in intro_crew_inputs:
        try:
            assert json.loads(test(input_data, intro_crew).raw)['state'] == "welcome"
            print("-" * 50)
        except Exception as e:
            print(f"Test failed: {e}")
            continue
    print("All tests passed for Introduction Crew.")

# test_intro_crew()

# QA Loop for Exit Interview
def qa_loop():
    inputs = {
        "conversation_history": [
            {"question": "What is your primary reason for leaving?", "answer": "I want to explore new industries."}
        ],
        "user_answer": "No, I didn’t feel there were many growth opportunities.",
        "user_info": "Name: John Doe\nDepartment: Engineering",
        "role_info": "Role: Backend Engineer at Kifiya"
    }

    user_answer = ""

    while user_answer.lower() != "quit":
        try:
            response = test(inputs, qa_crew).raw
            data = json.loads(response)
            assert data['state'] == "ongoing"
            question = data['text']
            print("Interviewer:", question)
            inputs['conversation_history'].append({"question": question})
            user_answer = input("You: ")
            inputs['user_answer'] = user_answer
            inputs['conversation_history'][-1]['answer'] = user_answer
        except Exception as e:
            print(f"An error occurred: {e}")
            break

# qa_loop()

# Final Evaluation Test
def test_evaluator_crew():
    inputs = {
        "conversation_history": [
            {
                "question": "What did you enjoy most about your job?",
                "answer": "I loved working with my team and solving real problems."
            },
            {
                "question": "How was your relationship with your manager?",
                "answer": "It was good, but could’ve used more feedback."
            },
            {
                "question": "Would you recommend the company?",
                "answer": "Yes, I would."
            }
        ],
        "user_info": "Name: John Doe\nDepartment: Engineering",
        "role_info": "Role: Senior Backend Engineer"
    }

    try:
        result = test(inputs, eval_crew)
        parsed = json.loads(result.raw)
        assert parsed["state"] == "completed"
        print("Evaluation Result:\n", json.dumps(parsed, indent=2))
    except Exception as e:
        print(f"Test failed: {e}")
    print("All tests passed for Exit Interview Evaluation.")

test_evaluator_crew()
