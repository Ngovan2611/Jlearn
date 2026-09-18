package authenticate.config;


import authenticate.dto.request.RoleRequest;
import authenticate.entity.Account;
import authenticate.entity.Role;
import authenticate.repository.AccountRepository;
import authenticate.repository.RoleRepository;
import authenticate.service.RoleService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashSet;

@Slf4j
@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationInitConfig {

    PasswordEncoderConfig passwordEncoderConfig;
    RoleService roleService;
    RoleRepository roleRepository;

    @Bean
    ApplicationRunner initApplicationRunner(AccountRepository accountRepository) {
        return args -> {

            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseGet(() -> {
                        Role admin = Role.builder()
                                .name("ADMIN")
                                .build();

                        log.info("Admin role created");
                        return roleRepository.save(admin);
                    });

            if(accountRepository.findAccountByUsername("admin").isEmpty()) {


                HashSet<Role> roles = new HashSet<>();
                roles.add(adminRole);

                Account account = Account.builder()
                        .username("admin")
                        .roles(roles)
                        .password(passwordEncoderConfig.passwordEncoder().encode("admin"))
                        .build();


                accountRepository.save(account);
                log.info("Admin account has been created");
            }
        };
    }
}
