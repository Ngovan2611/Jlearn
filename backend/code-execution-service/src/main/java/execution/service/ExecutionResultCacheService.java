package execution.service;

import execution.dto.response.CachedExecution;
import execution.exception.AppException;
import execution.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ExecutionResultCacheService {

    CacheManager cacheManager;

    private Cache getCache() {

        Cache cache = cacheManager.getCache("executionResults");

        if (cache == null) {
            throw new AppException(ErrorCode.CACHE_NOT_CONFIGURED);
        }

        return cache;
    }

    public void save(CachedExecution execution) {

        if (execution == null || execution.getExecutionId() == null) {
            throw new AppException(ErrorCode.INVALID_CACHED_EXECUTION);
        }

        getCache().put(
                execution.getExecutionId(),
                execution
        );
    }

    public CachedExecution get(String executionId) {

        if (executionId == null || executionId.isBlank()) {
            return null;
        }

        return getCache().get(
                executionId,
                CachedExecution.class
        );
    }

    public void evict(String executionId) {

        if (executionId != null && !executionId.isBlank()) {
            getCache().evict(executionId);
        }
    }
}