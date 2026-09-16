package authenticate.mapper;


import authenticate.dto.request.AccountCreationRequest;
import authenticate.dto.response.AccountResponse;
import authenticate.entity.Account;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AccountMapper {

    Account toEntity(AccountCreationRequest accountCreationRequest);

    AccountResponse toAccountResponse(Account account);

}
