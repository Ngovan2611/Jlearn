package authenticate.exception;


import authenticate.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.JwtEncodingException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiResponse> handleAppTimeException(AppException ex){
        ErrorCode errorCode = ex.getErrorCode();
        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<String>
    handleMethodArgumentNotValidException(MethodArgumentNotValidException ex){
        return  ResponseEntity.badRequest().body(ex.getFieldError().getDefaultMessage());
    }

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse> handleException(Exception ex){
        ApiResponse apiResponse = ApiResponse.builder()
                .message(ErrorCode.UNKNOW.getMessage())
                .code(ErrorCode.UNKNOW.getCode())
                .build();

        return ResponseEntity.status(ErrorCode.UNKNOW.getHttpStatus()).body(apiResponse);
    }



}
