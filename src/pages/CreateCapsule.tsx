import CapsuleForm from '../components/capsule/CapsuleForm';

function CreateCapsule() {
  return (
    <main className="create-page">
      <div className="create-container">
        <div className="create-header">
          <span className="eyebrow">
            Secure capsule
          </span>

          <h1>Create a private capsule</h1>

          <p>
            Add the information you want to share and choose
            how long it should remain available.
          </p>
        </div>

        <CapsuleForm />
      </div>
    </main>
  );
}

export default CreateCapsule;