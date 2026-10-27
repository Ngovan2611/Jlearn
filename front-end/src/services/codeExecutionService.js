
import apiClient from "./apiClients";

const codeExecutionService = {
    execute(request) {
        return apiClient.post("/code/execute", request);
    },

    runExercise(request) {
        return apiClient.post("/executions/run", request);
    }
};

export default codeExecutionService;
