---
title: "Local Models"
path: "/large-language-models/local-models"
visibility: "PUBLIC"
---
***

## Available Local LLMs

Find reference information and an up-to-date (January 31st, 2025) of local LLMs available for download that are currently supported by PiecesOS, the Pieces Desktop App, and other Pieces plugins and extensions.

## Supported LLMs

The Pieces for Developers Suite currently supports 41 local models from a range of providers.

***

| **Provider** | **Model Name**               |
| ------------ | ---------------------------- |
| *Google*     | Gemma / Code Gemma           |
| *IBM*        | Granite / Code / Dense / MoE |
| *Meta*       | LLaMA / CodeLLaMA            |
| *Mistral*    | Mistral / Mixtral            |
| *Microsoft*  | Phi                          |
| *Qwen*       | QwQ / Coder                  |
| *StarCoder*  | StarCoder                    |

View the tables below for detailed model names, parameters, and the context window size of all usable models.

<Callout type="alert">
  Please note that not all specific models have easily indentifiable **parameter quantities**. Some companies release information on their models, while others do not—as such, the parameters provided in these tables are **estimated parameter ranges** based on leading AI sources, detailed evaluations and assessments, and other available information.
</Callout>

### Google (Gemma)

***

| **Model Name**      | **Parameters** | **Context Window (Maximum)** |
| ------------------- | -------------- | ---------------------------- |
| *Gemma 2 27B*       | 27B            | 8k tokens                    |
| *Gemma 2 9B*        | 9B             | 8k tokens                    |
| *Gemma 2 2B*        | 2B             | 8k tokens                    |
| *Gemma 1.1 7B*      | 7B             | 4k tokens                    |
| *Gemma 1.1 2B*      | 2B             | 4k tokens                    |
| *Code Gemma 1.1 7B* | 7B             | 4k tokens                    |

### IBM (Granite)

***

| **Model Name**         | **Parameters** | **Context Window (Maximum)** |
| ---------------------- | -------------- | ---------------------------- |
| *Granite Code 34B*     | 34B            | 8k tokens                    |
| *Granite Code 20B*     | 20B            | 8k tokens                    |
| *Granite Code 8B*      | 8B             | 128k tokens                  |
| *Granite Code 3B 128K* | 3B             | 128k tokens                  |
| *Granite Code 3B*      | 3B             | 4k tokens                    |
| *Granite 3.1 Dense 8B* | 8B             | 128k tokens                  |
| *Granite 3.1 Dense 2B* | 2B             | 128k tokens                  |
| *Granite 3 MoE 3B*     | 3B             | 128k tokens                  |
| *Granite 3 MoE 1B*     | 1B             | 128k tokens                  |
| *Granite 3 Dense 8B*   | 8B             | 128k tokens                  |

### Meta (LLaMA)

***

| **Model Name**  | **Parameters** | **Context Window (Maximum)** |
| --------------- | -------------- | ---------------------------- |
| *LLaMA 3.2 3B*  | 3B             | 128k tokens                  |
| *LLaMA 3.2 1B*  | 1B             | 8k tokens                    |
| *LLaMA 3 8B*    | 8B             | 8k tokens                    |
| *LLaMA 2 13B*   | 13B            | 4lk tokens                   |
| *LLaMA 2 7B*    | 7B             | 4k tokens                    |
| *CodeLLaMA 34B* | 34B            | 100k tokens                  |
| *CodeLLaMA 13B* | 13B            | 16k tokens                   |
| *CodeLLaMA 7B*  | 7B             | 8k tokens                    |

### Mistral (Mixtral)

***

| **Model Name** | **Parameters** | **Context Window (Maximum)** |
| -------------- | -------------- | ---------------------------- |
| *Mixtral 8 7B* | 7B             | 128k tokens                  |
| *Mistral 7B*   | 7B             | 32.8k tokens                 |

### Microsoft (Phi)

***

| **Model Name**          | **Parameters** | **Context Window** |
| ----------------------- | -------------- | ------------------ |
| *Phi-4 14B*             | 14B            | 4k tokens          |
| *Phi-3.5 Mini 3.8B*     | 3.8B           | 128k tokens        |
| *Phi-3 Mini 128K*       | 3B             | 128k tokens        |
| *Phi-3 Mini 4K*         | 3B             | 4k tokens          |
| *Phi-3 Medium 14B 128K* | 14B            | 128k tokens        |
| *Phi-3 Medium 14B 4K*   | 14B            | 4k tokens          |
| *Phi-2*                 | N/A            | 4k tokens          |

### Qwen (Qwen)

***

| **Model Name**         | **Parameters** | **Context Window** |
| ---------------------- | -------------- | ------------------ |
| *Qwen QwQ Preview 32B* | 32B            | 32k tokens         |
| *Qwen 2.5 Coder 32B*   | 32B            | 128k tokens        |
| *Qwen 2.5 Coder 14B*   | 14B            | 32k tokens         |
| *Qwen 2.5 Coder 7B*    | 7B             | 128k tokens        |
| *Qwen 2.5 Coder 3B*    | 3B             | 32k tokens         |
| *Qwen 2.5 Coder 1.5B*  | 1.5B           | 128k tokens        |
| *Qwen 2.5 Coder 0.5B*  | 0.5B           | 32k tokens         |

### StarCoder (StarCoder)

***

| **Model Name**   | **Parameters** | **Context Window** |
| ---------------- | -------------- | ------------------ |
| *StarCode 2 15B* | 15b            | 16k tokens         |
