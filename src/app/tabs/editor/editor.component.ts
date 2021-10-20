// Copyright (C) 2021 Clavicode Team
// 
// This file is part of clavicode-frontend.
// 
// clavicode-frontend is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// clavicode-frontend is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with clavicode-frontend.  If not, see <http://www.gnu.org/licenses/>.

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EditorService } from '../../services/editor.service';
import { TabsService } from '../../services/tabs.service';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  key: string | null = null;
  code: string = "int main() {}";
  editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    glyphMargin: true,
    wordBasedSuggestions: false,
    lightbulb: {
        enabled: true
    },
    theme: "vs",
    language: "cpp"
  };

  constructor(private route: ActivatedRoute,
    private tabsService: TabsService,
    private editorService: EditorService) { }


  private keyOnChange(key: string) {
    if (typeof key === "undefined") this.key = null;
    this.key = key;
  }

  ngOnInit(): void {
    this.route.params.subscribe(routeParams => {
      this.keyOnChange(routeParams['key']);
    });
    console.log(this.editorService);
  }

  editorInit(editor: monaco.editor.IStandaloneCodeEditor) {
    console.log("Editor initialized");
    this.editorService.editorInit(editor);
    if (this.key) {
      const [activeTab] = this.tabsService.getByKey(this.key);
      if (activeTab) {
        this.editorService.switchToModel(activeTab);
      }
    }
  }
}
