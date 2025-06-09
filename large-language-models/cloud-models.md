---
title: "Cloud Models"
description: "Utilize cloud-hosted large language models (LLMs) from providers like OpenAI, Anthropic, and Google."
path: "/large-language-models/cloud-models"
visibility: "PUBLIC"
---
***

## Available Cloud LLMs

Find reference information and an up-to-date (as of March 18th, 2025) list of cloud LLMs available for use that PiecesOS, the Pieces Desktop App, and other Pieces plugins and extensions currently support.

## Supported LLMs

The Pieces for Developers Suite currently supports cloud models from a range of providers.

***

| **Provider** | **Model Name**                 |
| ------------ | ------------------------------ |
| *OpenAI*     | GPT-X                          |
| *Anthropic*  | Claude / Sonnet / Opus / Haiku |
| *Google*     | Gemini / Pro / Flash / Chat    |

View the tables below for detailed model names, parameters, and the context window size of all usable models.

<Callout type="alert">
  Please note that not all specific models have easily indentifiable **parameter quantities**. Some companies release information on their models, while others do not—as such, the parameters provided in these tables are **estimated parameter ranges** based on leading AI sources, detailed evaluations and assessments, and other available information.
</Callout>

## OpenAI

***

| **Model Name** | **Parameters** | **Context Window (Maximum)** |
| -------------- | -------------- | ---------------------------- |
| *GPT-4o Mini*  | 8b             | 128k tokens                  |
| *GPT-4o*       | N/A            | 128k tokens                  |
| *GPT-4 Turbo*  | N/A            | 128k tokens                  |
| *GPT-4*        | N/A            | 8k tokens                    |

## Anthropic

***

| **Model Name**      | **Parameters** | **Context Window (Maximum)** |
| ------------------- | -------------- | ---------------------------- |
| *Claude 3.7 Sonnet* | 175b           | 128k tokens                  |
| *Claude 3.5 Sonnet* | 175b           | 40k tokens                   |
| *Claude 3 Sonnet*   | 100b           | 40k tokens                   |
| *Claude 3 Opus*     | 150b           | 40k tokens                   |
| *Claude 3.5 Haiku*  | 175b           | 200k tokens                  |
| *Claude 3 Haiku*    | 175b           | 200k tokens                  |

## Google

***

| **Model Name**        | **Parameters** | **Context Window (Maximum)** |
| --------------------- | -------------- | ---------------------------- |
| *Gemini 2 Flash Lite* | 30b            | 1m tokens                    |
| *Gemini 2 Flash*      | 30b            | 1m tokens                    |
| *Gemini 1.5 Pro*      | 45b            | 128k tokens                  |
| *Gemini 1.5 Flash*    | 80b            | 256k tokens                  |