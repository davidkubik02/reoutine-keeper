import React, { useEffect } from "react";
import { useState } from "react";
import Task from "../components/Task";
import ValidationMessage from "../components/ValidationMessage";
import Menu from "../components/Menu";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  DocumentData,
  DocumentSnapshot,
} from "firebase/firestore";
import { TaskModel } from "../models/taskModel";

function NewTaskForm() {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [plannedTime, setPlannedTime] = useState<number | undefined>();
  const [deadline, setDeadline] = useState<number | undefined>();

  const [plannedTimeValidation, setPlannedTimeValidation] =
    useState<boolean>(false);
  const [deadlineValidation, setDealineValidation] = useState<boolean>(false);

  const [isNew, setIsNew] = useState<boolean>(true);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const clearInputs = (): void => {
      setName("");
      setDescription("");
      setPlannedTime(undefined);
      setDeadline(undefined);
      setIsNew(true);
    };
    if (id) {
      getTask(id).then((docSnap) => {
        if (docSnap.exists()) {
          setIsNew(false);
          const taskData = docSnap.data();
          setName(taskData.name);
          setDescription(taskData.description);
          setPlannedTime(taskData.plannedTime);
          setDeadline(taskData.deadline);
        } else {
          clearInputs();
        }
      });
    } else {
      clearInputs();
    }
  }, [id]);

  const getTask = async (
    id: string
  ): Promise<DocumentSnapshot<DocumentData>> => {
    const docRef = doc(db, "tasks", id);
    const docSnap = await getDoc(docRef);
    return docSnap;
  };
  const handleSubmit = (event: any): void => {
    event.preventDefault();
    if (plannedTime && plannedTime > 0 && plannedTime < 24) {
      setPlannedTimeValidation(false);
    } else {
      setPlannedTimeValidation(true);
      return;
    }
    if (deadline && deadline > 0 && deadline < 24 && plannedTime <= deadline) {
      setDealineValidation(false);
    } else {
      setDealineValidation(true);
      return;
    }
    const formData = {
      name,
      description,
      plannedTime,
      deadline,
      compleated: false,
      compleatedInTime: false,
    };
    if (isNew) {
      storeTask(formData);
    } else {
      updateTask(formData);
    }
  };

  const updateTask = async (task: TaskModel): Promise<void> => {
    if (!id) return;
    try {
      await updateDoc(doc(db, "tasks", id), {
        ...task,
      });
      alert("Úkol byl aktualizován");
      navigate("/reoutine-keeper");
    } catch {
      alert("Došlo k chybě");
    }
  };
  const storeTask = async (task: TaskModel): Promise<void> => {
    try {
      if (id) {
        await setDoc(doc(db, "tasks", id), {
          ...task,
          compleated: false,
          compleatedInTime: false,
        });
      } else {
        await addDoc(collection(db, "tasks"), {
          ...task,
          compleated: false,
          compleatedInTime: false,
        });
      }
      alert("Úkol byl vytvořen");
      navigate("/reoutine-keeper");
    } catch {
      alert("Došlo k chybě");
    }
  };

  const deleteTask = async () => {
    if (!id) return;
    if (window.confirm("Vážně chcete smazat tento úkol?")) {
      try {
        await deleteDoc(doc(db, "tasks", id));
        alert("Úkol byl úspěšně smazán");
        navigate("/reoutine-keeper");
      } catch {
        alert("Došlo k chybě");
      }
    }
  };

  const [menuActive, setMenuActive] = useState(false);

  const toggleMenu = () => {
    setMenuActive((menuActive) => !menuActive);
  };

  const changeHoursInTime = (
    oldTime: number | undefined,
    newHours: number | string
  ): number | undefined => {
    if (oldTime || oldTime === 0) {
      return Number(newHours) + (oldTime % 1);
    } else {
      return Number(newHours);
    }
  };
  const changeMinutesInTime = (
    oldTime: number | undefined,
    newMins: number | string
  ) => {
    if (oldTime || oldTime === 0) {
      return Number(newMins) / 60 + Math.floor(oldTime);
    } else {
      return Number(newMins) / 60;
    }
  };

  const calcHours = (time: number | undefined) => {
    return time && Math.floor(time);
  };
  const calcMins = (time: number | undefined) => {
    return time && (time % 1) * 60;
  };

  return (
    <>
      <Menu active={menuActive} />

      <div className="page-container">
        <header className="header">
          <div />
          <i
            onClick={toggleMenu}
            className={`${
              menuActive ? "fa-solid fa-xmark" : "fa-solid fa-bars"
            }`}
          />
        </header>
        <form className="new-form" onSubmit={handleSubmit}>
          <div className="form-input">
            <label htmlFor="name">Název:</label>
            <input
              type="text"
              id="name"
              value={name}
              maxLength={9}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="form-input">
            <label htmlFor="description">Popis:</label>
            <input
              type="text"
              id="description"
              value={description}
              maxLength={15}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="form-input">
            <label htmlFor="plannedTime">Naplánovaný čas:</label>
            <div className="time-input-container">
              <input
                type="text"
                className="time-input"
                placeholder="00"
                value={calcHours(plannedTime)}
                onChange={(e) => {
                  setPlannedTime((prevTime) =>
                    changeHoursInTime(prevTime, e.target.value)
                  );
                }}
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                className="time-input"
                id="minute-input"
                placeholder="00"
                value={calcMins(plannedTime)}
                onChange={(e) =>
                  setPlannedTime((prevTime) =>
                    changeMinutesInTime(prevTime, e.target.value)
                  )
                }
                maxLength={2}
              />
            </div>
            {plannedTimeValidation && (
              <ValidationMessage message="Zadej správnou hodnotu" />
            )}
          </div>
          <div className="form-input">
            <label htmlFor="deadline">Nejpozději do:</label>
            <div className="time-input-container">
              <input
                type="text"
                className="time-input"
                placeholder="00"
                value={calcHours(deadline)}
                onChange={(e) => {
                  setDeadline((prevTime) =>
                    changeHoursInTime(prevTime, e.target.value)
                  );
                }}
                maxLength={2}
              />
              <span>:</span>
              <input
                type="text"
                className="time-input"
                id="minute-input"
                placeholder="00"
                value={calcMins(deadline)}
                onChange={(e) => {
                  setDeadline((prevTime) =>
                    changeMinutesInTime(prevTime, e.target.value)
                  );
                }}
                maxLength={2}
              />
            </div>
            {deadlineValidation && (
              <ValidationMessage message="Zadej správnou hodnotu" />
            )}
          </div>
          <div className="task-preview">
            <div className="task-preview-overlay" />
            <Task
              taskInfo={{
                name,
                description,
                plannedTime: plannedTime ? plannedTime : 0,
                deadline: deadline ? deadline : 0,
                compleated: false,
                compleatedInTime: false,
              }}
            />
          </div>
          <input className="form-submit" type="submit" value="Uložit" />
          {!isNew && (
            <input
              type="button"
              onClick={deleteTask}
              className="form-submit"
              value="Smazat"
            />
          )}
        </form>
      </div>
    </>
  );
}

export default NewTaskForm;
