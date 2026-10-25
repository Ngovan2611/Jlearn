package profile.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import profile.dto.response.UserStatisticsResponse;
import profile.entity.Profile;
import profile.repository.ProfileRepository;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserStatisticsService {

    private final ProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public UserStatisticsResponse getStatistics() {
        var profiles = profileRepository.findAll();

        long totalProfiles = profiles.size();

        log.info("Total profiles: {}", totalProfiles);

        long profilesWithEmail = profiles.stream()
                .filter(profile -> hasText(profile.getEmail()))
                .count();

        long profilesWithAvatar = profiles.stream()
                .filter(profile -> hasText(profile.getUrl()))
                .count();

        long completedProfiles = profiles.stream()
                .filter(this::isProfileCompleted)
                .count();

        // Thống kê giới tính, bao gồm cả hồ sơ chưa nhập giới tính.
        Map<String, Long> genderDistribution = new LinkedHashMap<>();

        for (Profile profile : profiles) {
            String gender = profile.getGender();

            if (!hasText(gender)) {
                genderDistribution.merge(
                        "Không xác định", 1L, Long::sum
                );
            } else {
                String normalizedGender = normalizeGender(gender);

                genderDistribution.merge(
                        normalizedGender, 1L, Long::sum
                );
            }
        }

        log.info("Gender distribution: {}", genderDistribution);

        return UserStatisticsResponse.builder()
                .totalProfiles(totalProfiles)
                .profilesWithEmail(profilesWithEmail)
                .profilesWithPhone(0L)
                .profilesWithAvatar(profilesWithAvatar)
                .completedProfiles(completedProfiles)
                .genderDistribution(
                        Collections.unmodifiableMap(genderDistribution)
                )
                .build();
    }

    private String normalizeGender(String gender) {
        String value = gender.trim();

        if ("MALE".equalsIgnoreCase(value)
                || "Nam".equalsIgnoreCase(value)) {
            return "Nam";
        }

        if ("FEMALE".equalsIgnoreCase(value)
                || "Nữ".equalsIgnoreCase(value)) {
            return "Nữ";
        }

        if ("UNKNOWN".equalsIgnoreCase(value)
                || "Không xác định".equalsIgnoreCase(value)) {
            return "Không xác định";
        }

        // Giữ lại giá trị khác nếu hệ thống có thêm lựa chọn giới tính.
        return value;
    }

    private boolean isProfileCompleted(Profile profile) {
        return hasText(profile.getFirstName())
                && hasText(profile.getLastName())
                && hasText(profile.getEmail())
                && hasText(profile.getUrl());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
