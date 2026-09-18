package authenticate.exception;


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
    ROLE_NOT_EXISTED(1003, "role not existed", HttpStatus.BAD_REQUEST);





    int code;
    String message;
    HttpStatus httpStatus;
}
