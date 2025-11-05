import React from "react";
import Form from "@rjsf/core";
import type { JSONSchema7 } from "json-schema";

interface DynamicFormProps {
  schema: JSONSchema7;
  uiSchema?: any;
  formData?: any;
  onSubmit: (data: any) => void;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ schema, uiSchema, formData, onSubmit }) => {
  return (
    <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 8 }}>
      <Form
              schema={schema}
              uiSchema={uiSchema}
              formData={formData}
              onSubmit={({ formData }) => onSubmit(formData)}      />
    </div>
  );
};

export default DynamicForm;
