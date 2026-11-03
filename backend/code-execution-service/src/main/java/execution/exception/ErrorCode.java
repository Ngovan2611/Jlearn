package execution.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public enum ErrorCode {
    USER_EXISTED(1001, "user existed", HttpStatus.BAD_REQUEST),
    UNKNOW(999, "unknow error", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1000, "unauthenticated", HttpStatus.UNAUTHORIZED),
    USER_NOT_EXISTED(1002, "user not existed", HttpStatus.BAD_REQUEST),
    INVALID_TOKEN(1314, "invalid token", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_EXISTED(1003, "role not existed", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1004, "You dont have permission", HttpStatus.FORBIDDEN),
    COURSE_EXISTED(1111, "course existed", HttpStatus.BAD_REQUEST),
    COURSE_NOT_EXISTED(1112, "course not existed", HttpStatus.BAD_REQUEST),

    CATEGORY_EXISTED(1113, "category existed", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_EXISTED(1114, "category not existed", HttpStatus.BAD_REQUEST),

    LESSON_EXISTED(1115, "lesson existed", HttpStatus.BAD_REQUEST),
    LESSON_NOT_EXISTED(1116, "lesson not existed", HttpStatus.BAD_REQUEST),

    // --- Execution Verification ---
    INVALID_VERIFY_REQUEST(1201, "Invalid execution verification request", HttpStatus.BAD_REQUEST),
    EXECUTION_EXPIRED_OR_NOT_FOUND(1202, "Execution result expired or not found. Please run again.", HttpStatus.BAD_REQUEST),
    EXECUTION_ACCESS_DENIED(1203, "You are not allowed to use this execution", HttpStatus.FORBIDDEN),
    EXERCISE_ID_MISMATCH(1204, "Exercise ID does not match", HttpStatus.BAD_REQUEST),
    SOURCE_CODE_CHANGED(1205, "Source code has changed. Please run again.", HttpStatus.BAD_REQUEST),
    EXECUTION_DATA_INCOMPLETE(1206, "Execution data is incomplete. Please run again.", HttpStatus.BAD_REQUEST),
    TEST_CASES_UNAVAILABLE(1207, "Exercise test cases are unavailable", HttpStatus.BAD_REQUEST),
    TEST_CASES_CHANGED(1208, "Test cases have changed. Please run again.", HttpStatus.BAD_REQUEST),
    CACHED_RESULT_INVALID(1209, "Cached execution result is invalid. Please run again.", HttpStatus.BAD_REQUEST),

    // --- Exercise Execution & Validation ---
    EXERCISE_ID_REQUIRED(1210, "Exercise ID is required", HttpStatus.BAD_REQUEST),
    SOURCE_CODE_REQUIRED(1211, "Source code is required", HttpStatus.BAD_REQUEST),
    UNSUPPORTED_LANGUAGE(1212, "Currently only JAVA is supported", HttpStatus.BAD_REQUEST),
    EXERCISE_NO_TEST_CASES(1213, "Exercise has no test cases", HttpStatus.BAD_REQUEST),
    USER_ID_NOT_FOUND_IN_TOKEN(1214, "User ID not found in JWT token", HttpStatus.UNAUTHORIZED),

    // --- Cache & Fingerprint ---
    CACHE_NOT_CONFIGURED(1215, "Execution result cache not configured", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_CACHED_EXECUTION(1216, "Invalid cached execution object", HttpStatus.BAD_REQUEST),
    HASH_ALGORITHM_NOT_FOUND(1217, "Hash algorithm is not available in system", HttpStatus.INTERNAL_SERVER_ERROR);

    int code;
    String message;
    HttpStatus httpStatus;
}