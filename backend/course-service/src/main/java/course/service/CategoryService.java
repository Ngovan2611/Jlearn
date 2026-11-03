package course.service;


import course.dto.request.CategoryRequest;
import course.dto.response.CategoryResponse;
import course.entity.Category;
import course.exception.AppException;
import course.exception.ErrorCode;
import course.mapper.CategoryMapper;
import course.repository.CategoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor

public class CategoryService {
    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;


    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse createCategory(CategoryRequest categoryRequest) {

        if (categoryRepository.findByName(categoryRequest.getName()) != null) {
            throw new AppException(ErrorCode.CATEGORY_EXISTED);
        }

        Category category = categoryMapper.toEntity(categoryRequest);

        categoryRepository.save(category);
        return categoryMapper.toCategoryResponse(category);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse updateCategory(
            String id,
            CategoryRequest categoryRequest
    ) {

        Category categoryExisted = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new AppException(ErrorCode.CATEGORY_NOT_EXISTED)
                );

        categoryMapper.updateCategory(categoryRequest, categoryExisted);

        categoryRepository.save(categoryExisted);

        return categoryMapper.toCategoryResponse(categoryExisted);
    }

    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();

        return categories.stream()
                .map(categoryMapper::toCategoryResponse).toList();
    }

    public CategoryResponse getCategoryById(String id) {

        return categoryMapper.toCategoryResponse(categoryRepository.findById(id)
                .orElseThrow(() ->
                        new AppException(ErrorCode.CATEGORY_NOT_EXISTED)
                ));
    }

}
