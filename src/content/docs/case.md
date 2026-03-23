# String Case Converter

Convert any text between common naming conventions used in code, configuration, and documentation.

## Supported formats

| Format | Example |
|---|---|
| camelCase | helloWorldFoo |
| PascalCase | HelloWorldFoo |
| snake_case | hello_world_foo |
| kebab-case | hello-world-foo |
| SCREAMING_SNAKE | HELLO_WORLD_FOO |
| Title Case | Hello World Foo |
| lowercase | hello world foo |
| UPPERCASE | HELLO WORLD FOO |
| dot.case | hello.world.foo |

## How it works

Input text is split into words by detecting boundaries: spaces, underscores, hyphens, and camelCase transitions (lowercase-to-uppercase letter changes). All outputs are derived from the same word list, so switching between formats is lossless within a session.

## Permalink

The input is encoded in the URL query string (`?input=...`), making it easy to share a specific conversion.
