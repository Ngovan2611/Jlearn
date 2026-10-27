package course.exception;


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
    COURSE_EXISTED(1111, "course existed", HttpStatus.BAD_REQUEST),
    COURSE_NOT_EXISTED(1112, "course not existed", HttpStatus.BAD_REQUEST),

    CATEGORY_EXISTED(1112, "category existed", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_EXISTED(1112, "category not existed", HttpStatus.BAD_REQUEST),

    LESSON_EXISTED(1112, "lesson not existed", HttpStatus.BAD_REQUEST),
    LESSON_NOT_EXISTED(1112, "lesson not existed", HttpStatus.BAD_REQUEST);






    int code;
    String message;
    HttpStatus httpStatus;
}
