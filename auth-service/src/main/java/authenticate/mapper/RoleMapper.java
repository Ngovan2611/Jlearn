package authenticate.mapper;


import authenticate.dto.request.RoleRequest;
import authenticate.dto.response.RoleResponse;
import authenticate.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    @Mapping(target = "id", ignore = true)
    Role toEntity(RoleRequest roleRequest);

    RoleResponse toAccountResponse(Role role);

}
