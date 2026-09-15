package authenticate.exception;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;


@AllArgsConstructor
@NoArgsConstructor
@Getter
public enum ErrorCode {
    USER_EXISTED(1001, "user existed"),
    UNKNOW(999, "unknow error"),
    UNAUTHENTICATED(1000, "unauthenticated"),
    USER_NOT_EXISTED(1002, "user not existed");





    int code;
    String message;

}
