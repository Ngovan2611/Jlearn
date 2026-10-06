package course.mapper;

import course.dto.request.LessonRequest;
import course.dto.response.LessonResponse;
import course.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface LessonMapper {

    Lesson toLessonEntity(LessonRequest lesson);

    LessonResponse toLessonResponse(Lesson lesson);

    void updateLesson(LessonRequest lessonRequest, @MappingTarget Lesson lesson);


}
