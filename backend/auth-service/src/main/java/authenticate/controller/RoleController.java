package authenticate.controller;


import authenticate.dto.request.RoleRequest;
import authenticate.dto.response.ApiResponse;
import authenticate.dto.response.RoleResponse;
import authenticate.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,  makeFinal = true)
public class RoleController {

    RoleService roleService;

    @PostMapping("/role")
    public ApiResponse<RoleResponse> createRole(@RequestBody RoleRequest roleRequest) {

        return ApiResponse.<RoleResponse>builder()
                .result(roleService.createRole(roleRequest))
                .build();

    }

}
