package profile.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AddSkillsRequest {

    @NotEmpty
    @Size(max = 50)
    private List<
            @NotBlank @Size(max = 100) String
            > skills;
}