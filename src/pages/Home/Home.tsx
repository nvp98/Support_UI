import { useSelector } from "react-redux";
import type { RootState } from "../../store";
// import EditableTable from '../../components/CustomTable';
import DynamicForm from "../../components/DynamicForm";
import type { JSONSchema7 } from "json-schema";

const schema: JSONSchema7 = {
  title: "Demo Dynamic Form",
  type: "object",
  required: ["firstName"],
  properties: {
    firstName: { type: "string", title: "First name" },
    age: { type: "number", title: "Age" },
    friends: {
      type: "array",
      title: "Friends",
      items: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", title: "Friend Name" },
          email: { type: "string", title: "Email" },
        },
      },
    },
  },
};
const uiSchema = {
  name: {
    "ui:placeholder": "Nhập họ và tên...",
  },
  age: {
    "ui:widget": "updown", // widget spinner số thay vì input text
    "ui:help": "Tuổi phải >= 18",
  },
  // email: {
  //   "ui:widget": "email"    // input type="email"
  // }
  friends: {
    items: {
      email: {
        "ui:widget": "email",
      },
    },
  },
};
const HomePage = () => {
  const username = useSelector((state: RootState) => state.auth.username);
  // const dispatch = useDispatch()
  const handleSubmit = (data: any) => {
    console.log("Form data:", data);
  };
  return (
    <>
      <div>{username}</div>
      <h1 className="text-xl font-bold">Trang chủ </h1>
      {/* <EditableTable /> */}
      <DynamicForm
        schema={schema}
        uiSchema={uiSchema}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default HomePage;
