import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Agent } from '../../../../models/Agent';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-agent-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToggleButtonModule,
    ButtonModule,
    TextareaModule,
    TagModule
  ],
  templateUrl: './agent-editor.component.html',
  styleUrl: './agent-editor.component.scss',
})
export class AgentEditorComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() agent: Agent | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<Partial<Agent>>();
  @Output() cancel = new EventEmitter<void>();

  agentForm!: FormGroup;
  isEditMode = false;

  agentTypeOptions = [
    { label: 'Internal', value: 'internal' },
    { label: 'Client', value: 'client' }
  ];

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit() {
    if (this.agent) {
      this.isEditMode = true;
      this.populateForm(this.agent);
    } else {
      this.isEditMode = false;
      this.resetForm();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['agent'] && !changes['agent'].firstChange) {
      if (this.agent) {
        this.isEditMode = true;
        this.populateForm(this.agent);
      } else {
        this.isEditMode = false;
        this.resetForm();
      }
    }
  }

  private initForm() {
    this.agentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      minionImage: ['', [Validators.required]],
      embedCode: ['', [Validators.required]],
      tagsInput: [''],
      tags: [[] as string[]],
      agentType: ['internal', [Validators.required]],
      clientId: [''],
      isActive: [true],
      accentColor: ['#00cfff'],
      secondaryAccentColor: ['#0099cc']
    });

    // Sync tagsInput with tags array
    this.agentForm.get('tagsInput')?.valueChanges.subscribe((value: string) => {
      if (value) {
        const tags = value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        this.agentForm.patchValue({ tags }, { emitEvent: false });
      } else {
        this.agentForm.patchValue({ tags: [] }, { emitEvent: false });
      }
    });
  }

  private populateForm(agent: Agent) {
    const tags = agent.tags || [];
    this.agentForm.patchValue({
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      minionImage: agent.minionImage,
      embedCode: agent.embedCode,
      tags: tags,
      tagsInput: tags.join(', '),
      agentType: agent.agentType || 'internal',
      clientId: agent.clientId || '',
      isActive: agent.isActive !== undefined ? agent.isActive : true,
      accentColor: agent.accentColor || '#00cfff',
      secondaryAccentColor: agent.secondaryAccentColor || '#0099cc'
    });
  }

  private resetForm() {
    this.agentForm.reset({
      name: '',
      slug: '',
      description: '',
      minionImage: '',
      embedCode: '',
      tags: [],
      tagsInput: '',
      agentType: 'internal',
      clientId: '',
      isActive: true,
      accentColor: '#00cfff',
      secondaryAccentColor: '#0099cc'
    });
  }

  onSave() {
    if (this.agentForm.valid) {
      const formValue = this.agentForm.value;
      const agentData: Partial<Agent> = {
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description,
        minionImage: formValue.minionImage,
        embedCode: formValue.embedCode,
        tags: formValue.tags || [],
        agentType: formValue.agentType,
        clientId: formValue.clientId || undefined,
        isActive: formValue.isActive,
        accentColor: formValue.accentColor,
        secondaryAccentColor: formValue.secondaryAccentColor
      };

      this.save.emit(agentData);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.agentForm.controls).forEach(key => {
        this.agentForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  onVisibleChange(visible: boolean) {
    this.visibleChange.emit(visible);
    if (!visible) {
      this.resetForm();
    }
  }

  generateSlug() {
    const name = this.agentForm.get('name')?.value;
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      this.agentForm.patchValue({ slug });
    }
  }
}

