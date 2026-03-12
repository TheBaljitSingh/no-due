function removeIdVirtual(schema) {
  schema.set("toJSON", {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.id;
    }
  });

  schema.set("toObject", {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.id;
    }
  });
}

export default removeIdVirtual;