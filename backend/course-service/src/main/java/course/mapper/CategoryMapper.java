package course.mapper;

import course.dto.request.CategoryRequest;
import course.dto.response.CategoryResponse;
import course.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    Category toEntity(CategoryRequest categoryRequest);

    CategoryResponse toCategoryResponse(Category category);

    void updateCategory(
            CategoryRequest request,
            @MappingTarget Category category
    );
}
