package authenticate.mapper;


import authenticate.dto.request.AccountCreationRequest;
import authenticate.dto.response.AccountResponse;
import authenticate.entity.Account;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccountMapper {


    @Mapping(target = "roles", ignore = true)
    Account toEntity(AccountCreationRequest accountCreationRequest);

    AccountResponse toAccountResponse(Account account);

}
