FROM eclipse-temurin:21-jdk

RUN useradd -m -u 1001 runner

WORKDIR /workspace

RUN chown -R runner:runner /workspace

USER runner

CMD ["sh"]