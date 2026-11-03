package exercise.mapper;

import exercise.dto.request.TestCaseRequest;
import exercise.dto.response.TestCaseResponse;
import exercise.entity.TestCase;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TestCaseMapper {

    TestCase toTestCase(TestCaseRequest request);

    TestCaseResponse toTestCaseResponse(TestCase testCase);

    List<TestCaseResponse> toTestCaseResponses(
            List<TestCase> testCases
    );

    void updateTestCase(
            TestCaseRequest request,
            @MappingTarget TestCase testCase
    );
}