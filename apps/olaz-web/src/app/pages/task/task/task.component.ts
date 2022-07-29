/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit } from '@angular/core';
import { transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { TaskModel } from '../../../models/task.model';
import { TaskService } from '../../../services/task/tasks/task.service';
import { UserService } from '../../../services/user.service';
import { collectionGroup, doc, Firestore, getDoc, getDocs } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
@Component({
  selector: 'olaz-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
})
export class TaskComponent implements OnInit {
  taskListData: any;
  taskListFull: Array<any> = [];
  todo: any[] = [];
  doing: any[] = [];
  done: any[] = [];
  tempTasks: any[] = [];
  panelOpenState = true;
  isShowDetail = false;
  isActiveDropdown = false;
  onSelected = 'Choose option';
  taskData: any;
  updateTaskData!: TaskModel;
  newTaskTitle: any = '';
  message: any;
  currentRoomId: any;
  appear: any;
  constructor(
    private TaskService: TaskService,
    public userService: UserService,
    private firestore: Firestore,
    private _snackBar: MatSnackBar,
    private Router: Router
  ) {}

  ngOnInit(): void {
    this.userService.user$.subscribe((data) => {
      if (!data) return;
      this.appear = data;
    });
    this.tempTasks.length = 0;
    this.currentRoomId = localStorage.getItem('roomId');
    this.getTaskListData();
  }

  goback() {
    this.Router.navigate([`/ownspace/m/${this.currentRoomId}`]);
  }

  drop(event: any) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    console.log(event.currentIndex);
    console.log(event.previousIndex);
    if (event.container.id == 'cdk-drop-list-0') {
      this.updateTaskFunc(event.container.data[event.currentIndex], 0);
    } else if (event.container.id == 'cdk-drop-list-1') {
      this.updateTaskFunc(event.container.data[event.currentIndex], 1);
    } else {
      this.updateTaskFunc(event.container.data[event.currentIndex], 2);
    }
  }

  openSnackBar(message: any) {
    this._snackBar.open(message.message, '', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  async getTaskListData() {
    // this.taskListData = undefined;
    this.taskListData = await (await getDoc(doc(this.firestore, `rooms`, this.currentRoomId))).data()
    const q = query(collection(this.firestore, `rooms`, `${this.currentRoomId}/taskList`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // snapshot.docs.map(data => this.taskListFull.push(data.data()))
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          this.taskListFull.unshift(change.doc.data());
          console.log(change.doc.data())
        }
        if (change.type === 'modified') {
          console.log(change.type )
          for(let i = 0; i < this.taskListFull.length; i++){
            if(this.taskListFull[i] == change.doc.data()['id']){
              this.taskListFull[i] = change.doc.data();
            }
          }
        }
        if (change.type === 'removed') {
          const index = this.taskListFull.findIndex((value: any) => value['id'] == change.doc.data()['id']);
          this.taskListFull.slice(0, index).concat(this.taskListFull.slice(index+1));
        }
      });
      this.filterListTask()
    });
  }

  filterListTask() {
    console.log(this.taskListFull.length);
    if (this.taskListFull.length != 0) {
      this.taskListFull.filter((value) => {
        if (value.status == 0) return this.todo.push(value);
        if (value.status == 1) return this.doing.push(value);
        if (value.status == 2) return this.done.push(value);
        return;
      });
    }
  }

  addNew() {
    if (this.newTaskTitle == '') {
      // alert('You have to fill the task title!!');
      this.openSnackBar({ message: 'You have to fill the task title!!' });
      return;
    } else {
      const temp = {
        id: Date.now().toString(),
        title: this.newTaskTitle,
        description: '',
        deadline: Date.now(),
        status: 0,
        assignee: '',
        reporter: '',
        priority: 0,
        createdBy: this.userService.user.id,
        createdDate: Date.now(),
        updatedDate: Date.now(),
      };
      // this.todo.push(temp);
      this.TaskService.createTask(temp, this.currentRoomId).subscribe((data) =>
        this.openSnackBar(data)
      );
      this.newTaskTitle = '';
    }
    this.taskListFull.length = 0;
  }

  updateTaskFunc(task: any, status: any) {
    const data = {
      ...task,
      status: status,
      assignee: '',
      updatedDate: Date.now(),
    };
    this.TaskService.updateTask(data, data.id).subscribe((message) =>
      console.log(message)
    );
  }

  async deleteeEmit(event: any) {
    await this.TaskService.deleteTask(
      this.taskData,
      this.currentRoomId
    ).subscribe((message) => this.openSnackBar(message));
    this.taskListFull.length = 0;
    this.getTaskListData();
  }

  getShowDetailsClass(): string {
    let styleClass = '';
    if (this.isShowDetail == true) {
      styleClass = 'task-details';
    } else if (this.isShowDetail == false) {
      styleClass = 'not-show-task-details';
    }
    return styleClass;
  }

  showDetails(data: any) {
    this.isShowDetail = true;
    this.taskData = data;
    this.updateTaskData = {
      id: data.id,
      title: data.title,
      description: data.description,
      deadline: data.description,
      status: data.status,
      assignee: data.assignee,
      reporter: data.reporter,
      priority: data.priority,
      createdBy: data.createdBy,
      createdDate: data.createdDate,
      updatedDate: data.updatedDate,
    };
  }

  closeShowDetails() {
    this.isShowDetail = false;
  }
}
