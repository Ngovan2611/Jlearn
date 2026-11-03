package enrollment.exception;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;


@AllArgsConstructor
@NoArgsConstructor
@Getter
public enum ErrorCode {
    USER_EXISTED(1001, "user existed", HttpStatus.BAD_REQUEST),
    UNKNOW(999, "unknow error",  HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1000, "unauthenticated",   HttpStatus.UNAUTHORIZED),
    USER_NOT_EXISTED(1002, "user not existed",  HttpStatus.BAD_REQUEST),
    INVALID_TOKEN(1314, "invalid token", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_EXISTED(1003, "role not existed", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED(1004, "You dont have permission", HttpStatus.BAD_REQUEST),
    COURSE_NOT_FOUND(
            3001,
            "Course not found",
            HttpStatus.NOT_FOUND
    ),

    ENROLLMENT_NOT_FOUND(
            3002,
            "Enrollment not found",
            HttpStatus.NOT_FOUND
    ),

    ALREADY_ENROLLED(
            3003,
            "User already enrolled in this course",
            HttpStatus.BAD_REQUEST
    ),

    ENROLLMENT_NOT_ACTIVE(
            3004,
            "Enrollment is not active",
            HttpStatus.BAD_REQUEST
    ),

    PROGRESS_NOT_FOUND(
            3005,
            "Course progress not found",
            HttpStatus.NOT_FOUND
    ),
    LESSON_NOT_FOUND(
            3006,
            "Lesson not found in this course",
            HttpStatus.NOT_FOUND
    );





    int code;
    String message;
    HttpStatus httpStatus;
}
