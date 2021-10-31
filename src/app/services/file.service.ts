import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CppGetHeaderFileRequest, CppGetHeaderFileResponse } from '../api';
import { EditorService } from './editor.service';
import { TabsService } from './tabs.service';

import { v4 as uuid } from 'uuid';
import * as path from 'path';

const GET_HEADER_URL = `//${environment.backendHost}/cpp/getHeaderFile`;

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(
    private http: HttpClient,
    private tabsService: TabsService,
    private editorService: EditorService) {
    this.editorService.editorMessage.subscribe(({ type, arg }) => {
      switch (type) {
        case "requestOpen":
          this.locate(arg.path, arg.selection.startLineNumber, arg.selection.startColumn);
          break;
      }
    });
  }

  async open(showDialog = true, filepath: string): Promise<boolean> {
    const result = await this.http.post<CppGetHeaderFileResponse>(
      GET_HEADER_URL,
      <CppGetHeaderFileRequest>{
        path: filepath
      }).toPromise();
    if (result.success === false) {
      alert(result.reason);
      return false;
    }
    const tabList = this.tabsService.tabList.map(tab => tab.path);
    if (tabList.includes(filepath)) {
      return true;
    }
    const key = uuid();
    this.tabsService.add({
      key: key,
      type: "file",
      title: path.basename(filepath),
      code: result.content,
      path: filepath,
    });
    this.tabsService.changeActive(key);
    return true;
  }

  /**
   * Locate to a specify position of a file
   * @param filepath
   * @param row position
   * @param col position
   * @param type 'cursor' means set cursor to that position, 'debug' means set trace line
   */
  async locate(filepath: string, row: number, col: number, type: 'cursor' | 'debug' = 'cursor') {
    const target = this.tabsService.tabList.find(t => t.path === filepath);
    if (typeof target === "undefined") {
      const result = await this.open(false, filepath);
      if (!result) return;
    } else {
      this.tabsService.changeActive(target.key);
    }
    if (type === 'cursor') {
      this.editorService.setPosition({
        lineNumber: row,
        column: col
      });
    } else if (type === 'debug') {
      this.editorService.showTrace(row);
    }
  }
}
