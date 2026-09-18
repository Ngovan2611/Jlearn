package authenticate.service;


import authenticate.dto.request.RoleRequest;
import authenticate.dto.response.RoleResponse;
import authenticate.entity.Role;
import authenticate.exception.AppException;
import authenticate.exception.ErrorCode;
import authenticate.mapper.RoleMapper;
import authenticate.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RoleService {

    RoleRepository roleRepository;
    RoleMapper roleMapper;


    public RoleResponse createRole(RoleRequest roleRequest) {
        Role role = Role.builder().name(roleRequest.getName()).build();

        roleRepository.save(role);

        return roleMapper.toAccountResponse(role);

    }

    public List<Role> getAllByNameIn(Iterable<String> names) {
        return roleRepository.findAllByNameIn(names);
    }

    public Role getRoleByName(String name) {
        return roleRepository.findByName(name).orElseThrow(() ->
                new AppException(ErrorCode.ROLE_NOT_EXISTED));
    }
}
